import { createCipheriv, createDecipheriv, createHmac, timingSafeEqual } from "node:crypto";

import { Crypto, Effect, Layer, Redacted } from "effect";

import { CryptoError } from "#/errors";
import { secretCryptoConfig } from "#/node/config";
import { cryptoPurpose } from "#/purposes";
import { SecretCrypto, type FingerprintInput } from "#/secrets";

export const NodeSecretCrypto = {
  layer: Layer.effect(
    SecretCrypto,
    Effect.gen(function* () {
      const config = yield* secretCryptoConfig;
      const encryptionKey = Buffer.from(Redacted.value(config.encryptionKey), "base64");
      const hmacKey = Buffer.from(Redacted.value(config.hmacKey), "base64");
      const crypto = yield* Crypto.Crypto;

      const fingerprint = Effect.fn("SecretCrypto.fingerprint")((input: FingerprintInput) =>
        Effect.try({
          try: () => {
            // This branch preserves already persisted email idempotency fingerprints.
            const root =
              input.purpose === cryptoPurpose.emailOutboxFingerprint ? encryptionKey : hmacKey;
            const key = createHmac("sha256", root).update(input.purpose).digest();
            return createHmac("sha256", key).update(Redacted.value(input.value)).digest("hex");
          },
          catch: () => new CryptoError({ operation: "fingerprint" }),
        }),
      );

      return SecretCrypto.of({
        encrypt: Effect.fn("SecretCrypto.encrypt")(function* (input) {
          const nonce = yield* crypto
            .randomBytes(12)
            .pipe(Effect.mapError(() => new CryptoError({ operation: "encrypt" })));
          return yield* Effect.try({
            try: () => {
              const cipher = createCipheriv("aes-256-gcm", encryptionKey, nonce);
              cipher.setAAD(Buffer.from(input.purpose, "utf8"));
              const body = Buffer.concat([
                cipher.update(Redacted.value(input.plaintext), "utf8"),
                cipher.final(),
              ]);
              return `v1.${Buffer.from(nonce).toString("base64url")}.${body.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
            },
            catch: () => new CryptoError({ operation: "encrypt" }),
          });
        }),
        decrypt: Effect.fn("SecretCrypto.decrypt")((input) =>
          Effect.try({
            try: () => {
              const [version, nonce, body, tag, extra] = input.ciphertext.split(".");
              if (
                version !== "v1" ||
                nonce === undefined ||
                body === undefined ||
                tag === undefined ||
                extra !== undefined
              )
                throw new Error("Invalid ciphertext");
              const decipher = createDecipheriv(
                "aes-256-gcm",
                encryptionKey,
                Buffer.from(nonce, "base64url"),
              );
              decipher.setAAD(Buffer.from(input.purpose, "utf8"));
              decipher.setAuthTag(Buffer.from(tag, "base64url"));
              return Redacted.make(
                Buffer.concat([
                  decipher.update(Buffer.from(body, "base64url")),
                  decipher.final(),
                ]).toString("utf8"),
              );
            },
            catch: () => new CryptoError({ operation: "decrypt" }),
          }),
        ),
        fingerprint,
        verifyFingerprint: Effect.fn("SecretCrypto.verifyFingerprint")(function* (input) {
          const actual = Buffer.from(yield* fingerprint(input), "utf8");
          const expected = Buffer.from(input.expectedFingerprint, "utf8");
          return actual.length === expected.length && timingSafeEqual(actual, expected);
        }),
      });
    }),
  ),
} as const;
