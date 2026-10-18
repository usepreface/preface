import { Effect, Schema } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { ExternalIdentityCallbackInput } from "@usepreface/protocol/input";

import { matchesFlowActor } from "#/auth/external/binding";
import { makeExternalCompletion } from "#/auth/external/completion";
import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { AuthenticationLinks } from "#/auth/links";
import { makeOidcAccess } from "#/auth/oidc/access";
import { OidcIdentity } from "#/auth/oidc/provider";
import { makeExternalFlowFailure } from "#/auth/organization-identity/failure";
import { OrganizationAccess } from "#/organization/access";

export const makeOidcFlowCallback = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const provider = yield* OidcIdentity;
  const secrets = yield* makeIdentitySecrets;
  const access = yield* makeIdentityAccess;
  const organizationAccess = yield* makeOidcAccess;
  const actors = yield* OrganizationAccess;
  const links = yield* AuthenticationLinks;
  const complete = yield* makeExternalCompletion;
  const failFlow = yield* makeExternalFlowFailure;
  return Effect.fn("Application.auth.oidc.callback")(function* (
    input: ExternalIdentityCallbackInput,
    actor?: SessionActor,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(ExternalIdentityCallbackInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })));
    const stateHash = yield* random.digestToken({
      purpose: cryptoPurpose.authFlowState,
      token: decoded.state,
    });
    const flow = yield* transaction.run(
      Effect.gen(function* () {
        const pending = yield* repository.auth.authFlow.findByStateHash(stateHash);
        if (
          pending === undefined ||
          pending.provider !== "oidc" ||
          pending.targetOrganizationId === null ||
          !(yield* random.verifyToken({
            purpose: cryptoPurpose.authFlowBrowser,
            token: decoded.browserToken,
            expectedDigest: pending.browserBindingHash,
          }))
        )
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        if (!matchesFlowActor(pending, actor))
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        const claimed = yield* repository.auth.authFlow.claim(pending.id);
        if (claimed === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
        return claimed;
      }),
    );
    return yield* Effect.gen(function* () {
      if (
        decoded.error !== undefined ||
        decoded.code === undefined ||
        flow.pkceVerifierCiphertext === null ||
        flow.nonceHash === null
      )
        return yield* new IdentityError({ code: "INVALID_FLOW" });
      const connection = yield* repository.auth.identityConnection.findById(
        flow.identityConnectionId,
      );
      if (
        connection === undefined ||
        connection.provider !== "oidc" ||
        connection.organizationId !== flow.targetOrganizationId ||
        connection.revision !== flow.connectionRevision ||
        (flow.intent !== "test" && connection.status !== "active")
      )
        return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
      if (flow.intent === "test") {
        if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
        yield* actors.requireOwner(actor, connection.organizationId);
        yield* access.requireRecentEmail(actor);
      } else {
        if (actor !== undefined && flow.intent !== "accept_invitation")
          yield* organizationAccess.requireActorMember(actor, connection.organizationId);
        if (flow.intent === "link" && actor !== undefined) yield* access.requireRecentEmail(actor);
        if (flow.intent !== "link")
          yield* organizationAccess.requireApproved(connection.organizationId, connection.id);
        const organization = yield* repository.organization.organization.findById(
          connection.organizationId,
        );
        if (organization?.archivedAt !== null)
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
      }
      const proof = yield* secrets.decryptFlow(flow.id, flow.pkceVerifierCiphertext);
      if (
        !(yield* random.verifyToken({
          purpose: cryptoPurpose.authFlowNonce,
          token: proof.nonce,
          expectedDigest: flow.nonceHash,
        }))
      )
        return yield* new IdentityError({ code: "INVALID_FLOW" });
      const identity = yield* provider.exchangeAndVerify({
        configuration: connection.configuration,
        reauthenticate: flow.intent === "reauthenticate",
        maxAgeSeconds: flow.requestedMaxAgeSeconds,
        clientSecret: yield* secrets.decryptConnection(connection),
        redirectUri: new URL("/api/v1/auth/oidc/callback", links.publicOrigin).href,
        code: decoded.code,
        ...proof,
      });
      return yield* complete(
        flow,
        {
          ...identity,
          authenticatedAt: identity.authenticatedAt ?? null,
          validUntil: identity.validUntil ?? null,
          sessionExpiresAt: null,
        },
        actor,
      );
    }).pipe(Effect.catch((error) => failFlow(flow).pipe(Effect.andThen(Effect.fail(error)))));
  });
});
