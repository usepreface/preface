import { DateTime, Effect, Redacted, Schema } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import {
  AuthFlowId,
  type IdentityConnectionKeyId,
  IdentityError,
  type AuthFlowIntent,
  type IdentityConnectionId,
  type OrganizationId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { ExternalIdentityStartInput } from "@usepreface/protocol/input";

import { externalFlowExpiresAt, type InvitationEnrollment } from "#/auth/external/binding";
import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { AuthenticationLinks } from "#/auth/links";
import { makeOrganizationIdentityAccess } from "#/auth/organization-identity/access";
import { makeSamlConnectionApplication } from "#/auth/saml/connection";
import { makeSigningKeySecrets } from "#/auth/saml/key-secrets";
import { isPendingKeyUsable } from "#/auth/saml/keys";
import { SamlIdentity } from "#/auth/saml/provider";
import { OrganizationAccess } from "#/organization/access";

export const makeSamlFlowStart = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const secrets = yield* makeIdentitySecrets;
  const identities = yield* makeIdentityAccess;
  const members = yield* makeOrganizationIdentityAccess;
  const organizations = yield* OrganizationAccess;
  const connections = yield* makeSamlConnectionApplication;
  const provider = yield* SamlIdentity;
  const links = yield* AuthenticationLinks;
  const keySecrets = yield* makeSigningKeySecrets;
  return Effect.fn("Application.auth.saml.start")(function* (
    intent: AuthFlowIntent,
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    input: ExternalIdentityStartInput = {},
    actor?: SessionActor,
    expectedRevision?: number,
    enrollment?: InvitationEnrollment,
    signingKeyId?: IdentityConnectionKeyId,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(ExternalIdentityStartInput)(input).pipe(
      Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })),
    );
    if (intent === "sign_in" && actor !== undefined)
      return yield* new IdentityError({ code: "ALREADY_AUTHENTICATED" });
    if (intent !== "sign_in" && intent !== "accept_invitation" && actor === undefined)
      return yield* new IdentityError({ code: "INVALID_FLOW" });
    if ((intent === "accept_invitation") !== (enrollment !== undefined))
      return yield* new IdentityError({ code: "INVALID_FLOW" });
    const relayState = yield* random.randomToken();
    const browserToken = yield* random.randomToken();
    const requestId = `_${Redacted.value(yield* random.randomToken())}`;
    const id = Schema.decodeSync(AuthFlowId)(generateUuid7());
    const stateHash = yield* random.digestToken({
      purpose: cryptoPurpose.samlRelay,
      token: relayState,
    });
    const browserBindingHash = yield* random.digestToken({
      purpose: cryptoPurpose.samlBrowser,
      token: browserToken,
    });
    return yield* transaction.run(
      Effect.gen(function* () {
        const connection = yield* connections.requireConnection(organizationId, connectionId, true);
        if (intent === "test") {
          if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
          if (connection.revision !== expectedRevision)
            return yield* new IdentityError({ code: "REVISION_CONFLICT" });
          yield* organizations.requireOwner(actor, organizationId, { lock: true });
          yield* identities.requireRecentEmail(actor);
        } else {
          if (connection.status !== "active")
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
          if (actor !== undefined && intent !== "accept_invitation")
            yield* members.requireActorMember(actor, organizationId, true);
          if (intent === "link" && actor !== undefined) yield* identities.requireRecentEmail(actor);
          if (intent === "sign_in" || intent === "reauthenticate" || intent === "accept_invitation")
            yield* members.requireApproved(organizationId, connectionId);
          const organization = yield* repository.organization.organization.findById(organizationId);
          if (organization?.archivedAt !== null)
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        }
        const policy =
          yield* repository.organization.authPolicy.findByOrganizationId(organizationId);
        if (policy === undefined)
          return yield* Effect.die(new Error("Organization has no authentication policy"));
        const requestedMaxAgeSeconds =
          intent === "reauthenticate"
            ? 0
            : policy.ssoMode === "required"
              ? policy.ssoMaxAgeSeconds
              : null;
        const key =
          signingKeyId === undefined
            ? undefined
            : yield* repository.auth.identityConnectionKey.find(signingKeyId, true);
        if (
          signingKeyId !== undefined &&
          (intent !== "test" ||
            key === undefined ||
            key.identityConnectionId !== connectionId ||
            !isPendingKeyUsable(key, connection.revision, yield* DateTime.now))
        )
          return yield* new IdentityError({ code: "KEY_UNAVAILABLE" });
        const authorizationUrl = yield* provider.authorizationUrl({
          configuration:
            key === undefined
              ? connection.configuration
              : { ...connection.configuration, signingCertificate: key.certificate },
          privateKey:
            key === undefined
              ? yield* secrets.decryptConnection(connection)
              : yield* keySecrets.decrypt(key),
          requestId,
          relayState,
          forceAuthentication: intent === "reauthenticate" || policy.ssoMode === "required",
        });
        const now = yield* DateTime.now;
        const expiresAt = externalFlowExpiresAt(now, enrollment);
        if (DateTime.toEpochMillis(expiresAt) <= DateTime.toEpochMillis(now))
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        yield* repository.auth.authFlow.create({
          id,
          signingKeyId: signingKeyId ?? null,
          provider: "saml",
          identityConnectionId: connectionId,
          connectionRevision: connection.revision,
          intent,
          invitationId: enrollment?.invitationId ?? null,
          invitationRevision: enrollment?.invitationRevision ?? null,
          displayName: enrollment?.displayName ?? null,
          requestedMaxAgeSeconds,
          initiatingSessionId: actor?.session.id ?? null,
          expectedUserId: actor?.user.id ?? null,
          targetOrganizationId: organizationId,
          stateHash,
          browserBindingHash,
          samlRequestId: requestId,
          nonceHash: null,
          pkceVerifierCiphertext: null,
          returnPath:
            decoded.returnPath ?? (links.dashboardOrigin === undefined ? "/api/docs" : "/"),
          expiresAt,
        });
        yield* repository.audit.event.append({
          actorKind: actor === undefined ? "system" : "user",
          actorUserId: actor?.user.id ?? null,
          organizationId,
          eventType: "auth.external_flow_started",
          targetType: "auth_flow",
          targetId: id,
          metadata: { intent },
        });
        return { authorizationUrl, expiresAt, browserToken };
      }),
    );
  });
});
