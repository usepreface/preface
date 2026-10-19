import { DateTime, Effect, Schema } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { AuthFlowId, IdentityError, type AuthFlowIntent } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { GoogleStartInput } from "@usepreface/protocol/input";

import { externalFlowExpiresAt, type InvitationEnrollment } from "#/auth/external/binding";
import { GoogleIdentity } from "#/auth/google/provider";
import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { AuthenticationLinks } from "#/auth/links";
import { OrganizationAccess } from "#/organization/access";

export const makeGoogleFlowStart = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const tokens = yield* TokenCrypto;
  const provider = yield* GoogleIdentity;
  const secrets = yield* makeIdentitySecrets;
  const identityAccess = yield* makeIdentityAccess;
  const actors = yield* OrganizationAccess;
  const links = yield* AuthenticationLinks;
  return Effect.fn("Application.auth.google.start")(function* (
    intent: AuthFlowIntent,
    actor: SessionActor | undefined,
    input: GoogleStartInput = {},
    expectedRevision?: number,
    enrollment?: InvitationEnrollment,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(GoogleStartInput)(input).pipe(
      Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })),
    );
    if (intent === "sign_in" && actor !== undefined)
      return yield* new IdentityError({ code: "ALREADY_AUTHENTICATED" });
    if (intent !== "sign_in" && intent !== "accept_invitation" && actor === undefined)
      return yield* new IdentityError({ code: "INVALID_FLOW" });
    if ((intent === "accept_invitation") !== (enrollment !== undefined))
      return yield* new IdentityError({ code: "INVALID_FLOW" });
    const state = yield* tokens.randomToken();
    const nonce = yield* tokens.randomToken();
    const verifier = yield* tokens.randomToken();
    const browserToken = yield* tokens.randomToken();
    const id = Schema.decodeSync(AuthFlowId)(generateUuid7());
    const stateHash = yield* tokens.digestToken({
      purpose: cryptoPurpose.authFlowState,
      token: state,
    });
    const nonceHash = yield* tokens.digestToken({
      purpose: cryptoPurpose.authFlowNonce,
      token: nonce,
    });
    const browserBindingHash = yield* tokens.digestToken({
      purpose: cryptoPurpose.authFlowBrowser,
      token: browserToken,
    });
    const codeChallenge = yield* tokens.pkceChallenge(verifier);
    const ciphertext = yield* secrets.encryptFlow(id, verifier, nonce, state);
    return yield* transaction.run(
      Effect.gen(function* () {
        // Instance administration takes installation before connection; callbacks follow the same order.
        if (intent === "test") yield* repository.instance.installation.lock();
        const previous = yield* repository.auth.identityConnection.findGoogle();
        if (previous === undefined)
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        const connection = yield* repository.auth.identityConnection.lockById(previous.id);
        if (
          connection === undefined ||
          connection.provider !== "google" ||
          (intent !== "test" && connection.status !== "active")
        )
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        if (intent === "test" && connection.revision !== expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        if (actor !== undefined) {
          yield* actors.requireActor(actor);
          if (intent === "link") {
            yield* identityAccess.requireVerifiedEmail(actor);
            const member = yield* repository.organization.member.findByUserId(
              connection.organizationId,
              actor.user.id,
            );
            if (member === undefined || member.removedAt !== null || member.suspendedAt !== null)
              return yield* new IdentityError({ code: "FORBIDDEN" });
          }
          if (intent === "test") yield* actors.requireOwner(actor, connection.organizationId);
        }
        const now = yield* DateTime.now;
        const expiresAt = externalFlowExpiresAt(now, enrollment);
        if (DateTime.toEpochMillis(expiresAt) <= DateTime.toEpochMillis(now))
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        const authorizationUrl = yield* provider.authorizationUrl({
          clientId: connection.configuration.clientId,
          clientSecret: yield* secrets.decryptConnection(connection),
          redirectUri: new URL("/api/v1/auth/google/callback", links.publicOrigin).href,
          state,
          nonce,
          codeChallenge,
        });
        yield* repository.auth.authFlow.create({
          id,
          identityConnectionId: connection.id,
          connectionRevision: connection.revision,
          intent,
          invitationId: enrollment?.invitationId ?? null,
          invitationRevision: enrollment?.invitationRevision ?? null,
          displayName: enrollment?.displayName ?? null,
          initiatingSessionId: actor?.session.id ?? null,
          expectedUserId: actor?.user.id ?? null,
          targetOrganizationId: enrollment?.targetOrganizationId ?? connection.organizationId,
          stateHash,
          nonceHash,
          browserBindingHash,
          pkceVerifierCiphertext: ciphertext,
          returnPath:
            decoded.returnPath ?? (links.dashboardOrigin === undefined ? "/api/docs" : "/"),
          expiresAt,
        });
        yield* repository.audit.event.append({
          actorKind: actor === undefined ? "system" : "user",
          actorUserId: actor?.user.id ?? null,
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
