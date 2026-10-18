import { Effect, Redacted, Schema } from "effect";

import { SecretCrypto, cryptoPurpose } from "@usepreface/crypto";
import { IdentityConnectionId, IdentityConnectionKeyId, IdentityError } from "@usepreface/protocol";
import type { IdentityConnectionKey } from "@usepreface/protocol/model";
const envelopeSchema = Schema.fromJsonString(
  Schema.Struct({
    version: Schema.Literal(1),
    keyId: IdentityConnectionKeyId,
    connectionId: IdentityConnectionId,
    revision: Schema.Int,
    certificate: Schema.String,
    privateKey: Schema.String,
  }),
);
export const makeSigningKeySecrets = Effect.gen(function* () {
  const crypto = yield* SecretCrypto;
  return {
    encrypt: Effect.fn("SigningKeySecrets.encrypt")(function* (
      key: Pick<
        IdentityConnectionKey,
        "id" | "identityConnectionId" | "connectionRevision" | "certificate"
      >,
      privateKey: Redacted.Redacted<string>,
    ) {
      return yield* crypto.encrypt({
        purpose: cryptoPurpose.connectionSigningKey,
        plaintext: Redacted.make(
          Schema.encodeSync(envelopeSchema)({
            version: 1,
            keyId: key.id,
            connectionId: key.identityConnectionId,
            revision: key.connectionRevision,
            certificate: key.certificate,
            privateKey: Redacted.value(privateKey),
          }),
        ),
      });
    }),
    decrypt: Effect.fn("SigningKeySecrets.decrypt")(function* (key: IdentityConnectionKey) {
      if (key.privateKeyCiphertext === null)
        return yield* new IdentityError({ code: "KEY_UNAVAILABLE" });
      const plaintext = yield* crypto.decrypt({
        purpose: cryptoPurpose.connectionSigningKey,
        ciphertext: key.privateKeyCiphertext,
      });
      const envelope = yield* Schema.decodeUnknownEffect(envelopeSchema)(
        Redacted.value(plaintext),
      ).pipe(Effect.mapError(() => new IdentityError({ code: "KEY_UNAVAILABLE" })));
      if (
        envelope.keyId !== key.id ||
        envelope.connectionId !== key.identityConnectionId ||
        envelope.revision !== key.connectionRevision ||
        envelope.certificate !== key.certificate
      )
        return yield* new IdentityError({ code: "KEY_UNAVAILABLE" });
      return Redacted.make(envelope.privateKey);
    }),
  };
});
