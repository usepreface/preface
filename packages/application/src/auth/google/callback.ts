import { Effect, Schema } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { GoogleCallbackInput } from "@usepreface/protocol/input";
import type { AuthFlow } from "@usepreface/protocol/model";

import { matchesFlowActor } from "#/auth/external/binding";
import { makeExternalCompletion } from "#/auth/external/completion";
import { GoogleIdentity } from "#/auth/google/provider";
import { makeIdentitySecrets } from "#/auth/google/secrets";
import { AuthenticationLinks } from "#/auth/links";

export const makeGoogleFlowCallback = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const provider = yield* GoogleIdentity;
  const secrets = yield* makeIdentitySecrets;
  const links = yield* AuthenticationLinks;
  const complete = yield* makeExternalCompletion;
  const failFlow = Effect.fn("GoogleFlow.fail")(function* (flow: AuthFlow) {
    yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.auth.authFlow.revoke(flow.id);
        yield* repository.audit.event.append({
          actorKind: flow.expectedUserId === null ? "system" : "user",
          actorUserId: flow.expectedUserId,
          eventType: "auth.external_flow_failed",
          targetType: "auth_flow",
          targetId: flow.id,
          metadata: { intent: flow.intent },
        });
      }),
    );
  });
  return Effect.fn("Application.auth.google.callback")(function* (
    input: GoogleCallbackInput,
    actor?: SessionActor,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(GoogleCallbackInput))(
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
          pending.provider !== "google" ||
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
        connection.provider !== "google" ||
        connection.revision !== flow.connectionRevision ||
        (flow.intent !== "test" && connection.status !== "active")
      )
        return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
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
        clientId: connection.configuration.clientId,
        clientSecret: yield* secrets.decryptConnection(connection),
        redirectUri: new URL("/api/v1/auth/google/callback", links.publicOrigin).href,
        code: decoded.code,
        ...proof,
      });
      return yield* complete(
        flow,
        {
          ...identity,
          issuer: "https://accounts.google.com",
          authenticatedAt: null,
          validUntil: identity.validUntil ?? null,
          sessionExpiresAt: null,
        },
        actor,
      );
    }).pipe(Effect.catch((error) => failFlow(flow).pipe(Effect.andThen(Effect.fail(error)))));
  });
});
