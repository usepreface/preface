import { Effect, Redacted, Schema } from "effect";

import { SecretCrypto, cryptoPurpose } from "@usepreface/crypto";
import { IdentityError, IdentityConnectionId, AuthFlowId } from "@usepreface/protocol";
import type { IdentityConnection } from "@usepreface/protocol/model";
const connectionEnvelope = Schema.fromJsonString(
  Schema.Struct({
    version: Schema.Literal(1),
    connectionId: IdentityConnectionId,
    revision: Schema.Int,
    secret: Schema.NonEmptyString,
  }),
);
const flowEnvelope = Schema.fromJsonString(
  Schema.Struct({
    version: Schema.Literal(1),
    flowId: AuthFlowId,
    verifier: Schema.NonEmptyString,
    nonce: Schema.NonEmptyString,
    state: Schema.NonEmptyString,
  }),
);
export const makeIdentitySecrets = Effect.gen(function* () {
  const crypto = yield* SecretCrypto;
  const encryptConnection = Effect.fn("IdentitySecrets.encryptConnection")(function* (
    connectionId: IdentityConnectionId,
    revision: number,
    secret: Redacted.Redacted<string>,
  ) {
    return yield* crypto.encrypt({
      purpose: cryptoPurpose.identityConnection,
      plaintext: Redacted.make(
        Schema.encodeSync(connectionEnvelope)({
          version: 1,
          connectionId,
          revision,
          secret: Redacted.value(secret),
        }),
      ),
    });
  });
  const decryptConnection = Effect.fn("IdentitySecrets.decryptConnection")(function* (
    connection: IdentityConnection,
  ) {
    const plaintext = yield* crypto.decrypt({
      purpose: cryptoPurpose.identityConnection,
      ciphertext: connection.secretsCiphertext,
    });
    const envelope = yield* Schema.decodeUnknownEffect(connectionEnvelope)(
      Redacted.value(plaintext),
    ).pipe(Effect.mapError(() => new IdentityError({ code: "CONNECTION_UNAVAILABLE" })));
    if (envelope.connectionId !== connection.id || envelope.revision !== connection.revision)
      return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
    return Redacted.make(envelope.secret);
  });
  const encryptFlow = Effect.fn("IdentitySecrets.encryptFlow")(function* (
    flowId: AuthFlowId,
    verifier: Redacted.Redacted<string>,
    nonce: Redacted.Redacted<string>,
    state: Redacted.Redacted<string>,
  ) {
    return yield* crypto.encrypt({
      purpose: cryptoPurpose.authFlowVerifier,
      plaintext: Redacted.make(
        Schema.encodeSync(flowEnvelope)({
          version: 1,
          flowId,
          verifier: Redacted.value(verifier),
          nonce: Redacted.value(nonce),
          state: Redacted.value(state),
        }),
      ),
    });
  });
  const decryptFlow = Effect.fn("IdentitySecrets.decryptFlow")(function* (
    flowId: AuthFlowId,
    ciphertext: string,
  ) {
    const plaintext = yield* crypto.decrypt({
      purpose: cryptoPurpose.authFlowVerifier,
      ciphertext,
    });
    const envelope = yield* Schema.decodeUnknownEffect(flowEnvelope)(
      Redacted.value(plaintext),
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })));
    if (envelope.flowId !== flowId) return yield* new IdentityError({ code: "INVALID_FLOW" });
    return {
      verifier: Redacted.make(envelope.verifier),
      nonce: Redacted.make(envelope.nonce),
      state: Redacted.make(envelope.state),
    };
  });
  return { encryptConnection, decryptConnection, encryptFlow, decryptFlow };
});
