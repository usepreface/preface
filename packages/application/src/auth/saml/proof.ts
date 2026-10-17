import { Effect, Redacted, Schema } from "effect";

import { SecretCrypto, cryptoPurpose } from "@usepreface/crypto";
import { AuthFlowId, IdentityError } from "@usepreface/protocol";

const identity = Schema.Struct({
  issuer: Schema.String,
  subject: Schema.String,
  authenticatedAt: Schema.DateTimeUtcFromString,
  validUntil: Schema.DateTimeUtcFromString,
  sessionExpiresAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
const envelope = Schema.fromJsonString(
  Schema.Struct({ version: Schema.Literal(1), flowId: AuthFlowId, identity }),
);
export const makeSamlFlowProof = Effect.gen(function* () {
  const crypto = yield* SecretCrypto;
  const encrypt = Effect.fn("SamlFlowProof.encrypt")(function* (
    flowId: AuthFlowId,
    verified: typeof identity.Type,
  ) {
    return yield* crypto.encrypt({
      purpose: cryptoPurpose.samlFlow,
      plaintext: Redacted.make(
        Schema.encodeSync(envelope)({ version: 1, flowId, identity: verified }),
      ),
    });
  });
  const decrypt = Effect.fn("SamlFlowProof.decrypt")(function* (
    flowId: AuthFlowId,
    ciphertext: string,
  ) {
    const plaintext = yield* crypto.decrypt({ purpose: cryptoPurpose.samlFlow, ciphertext });
    const decoded = yield* Schema.decodeUnknownEffect(envelope)(Redacted.value(plaintext)).pipe(
      Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })),
    );
    if (decoded.flowId !== flowId) return yield* new IdentityError({ code: "INVALID_FLOW" });
    return decoded.identity;
  });
  return { encrypt, decrypt };
});
