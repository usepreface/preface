import { Config, Effect, Option, Schema } from "effect";

const Key = Schema.Redacted(Schema.String.check(Schema.isPattern(/^[A-Za-z0-9+/]{43}=$/)));

export const secretCryptoConfig = Effect.gen(function* () {
  const encryption = yield* Config.option(Config.schema(Key, "CRYPTO_ENCRYPTION_KEY"));
  // Existing outbox ciphertext must remain readable during the configuration rename.
  const encryptionKey = Option.isSome(encryption)
    ? encryption.value
    : yield* Config.schema(Key, "EMAIL_ENCRYPTION_KEY");
  const hmacKey = yield* Config.schema(Key, "CRYPTO_HMAC_KEY");
  return { encryptionKey, hmacKey } as const;
});
