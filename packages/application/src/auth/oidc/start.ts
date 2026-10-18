import { DateTime, Effect, Schema } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import {
  AuthFlowId,
  IdentityError,
  type AuthFlowIntent,
  type IdentityConnectionId,
  type OrganizationId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { ExternalIdentityStartInput } from "@usepreface/protocol/input";

import type { InvitationEnrollment } from "#/auth/external/binding";
import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { AuthenticationLinks } from "#/auth/links";
import { makeOidcAccess } from "#/auth/oidc/access";
import { OidcIdentity } from "#/auth/oidc/provider";
import { OrganizationAccess } from "#/organization/access";

export const makeOidcFlowStart = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const provider = yield* OidcIdentity;
  const secrets = yield* makeIdentitySecrets;
  const identityAccess = yield* makeIdentityAccess;
  const organizations = yield* OrganizationAccess;
  const access = yield* makeOidcAccess;
  const links = yield* AuthenticationLinks;
  return Effect.fn("Application.auth.oidc.start")(function* (
    intent: AuthFlowIntent,
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    input: ExternalIdentityStartInput = {},
    actor?: SessionActor,
    expectedRevision?: number,
    enrollment?: InvitationEnrollment,
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
    const state = yield* random.randomToken();
    const nonce = yield* random.randomToken();
    const verifier = yield* random.randomToken();
    const browserToken = yield* random.randomToken();
    const id = Schema.decodeSync(AuthFlowId)(generateUuid7());
    const stateHash = yield* random.digestToken({
      purpose: cryptoPurpose.authFlowState,
      token: state,
    });
    const nonceHash = yield* random.digestToken({
      purpose: cryptoPurpose.authFlowNonce,
      token: nonce,
    });
    const browserBindingHash = yield* random.digestToken({
      purpose: cryptoPurpose.authFlowBrowser,
      token: browserToken,
    });
    const codeChallenge = yield* random.pkceChallenge(verifier);
    const ciphertext = yield* secrets.encryptFlow(id, verifier, nonce, state);
    return yield* transaction.run(
      Effect.gen(function* () {
        // Connection -> organization -> user is shared with configuration and callback completion.
        const connection = yield* access.requireConnection(organizationId, connectionId, true);
        if (intent === "test") {
          if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
          if (connection.revision !== expectedRevision)
            return yield* new IdentityError({ code: "REVISION_CONFLICT" });
          yield* organizations.requireOwner(actor, organizationId, { lock: true });
          yield* identityAccess.requireRecentEmail(actor);
        } else {
          if (connection.status !== "active")
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
          if (actor !== undefined && intent !== "accept_invitation")
            yield* access.requireActorMember(actor, organizationId, true);
          if (intent === "link") {
            if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
            yield* identityAccess.requireRecentEmail(actor);
          }
          if (intent === "sign_in" || intent === "reauthenticate" || intent === "accept_invitation")
            yield* access.requireApproved(organizationId, connectionId);
          // Signed-out starts expose no member information and still reject archived organizations.
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
            : intent !== "test" && policy.ssoMode === "required"
              ? policy.ssoMaxAgeSeconds
              : null;
        const authorizationUrl = yield* provider.authorizationUrl({
          configuration: connection.configuration,
          clientSecret: yield* secrets.decryptConnection(connection),
          redirectUri: new URL("/api/v1/auth/oidc/callback", links.publicOrigin).href,
          state,
          nonce,
          codeChallenge,
          reauthenticate: intent === "reauthenticate",
          maxAgeSeconds: requestedMaxAgeSeconds,
        });
        const expiresAt = DateTime.addDuration(yield* DateTime.now, "10 minutes");
        yield* repository.auth.authFlow.create({
          id,
          provider: "oidc",
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
          nonceHash,
          pkceVerifierCiphertext: ciphertext,
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
