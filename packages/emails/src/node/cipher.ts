import { createCipheriv, createDecipheriv, createHmac } from "node:crypto";

import { Config, Crypto, Effect, Layer, Redacted, Schema } from "effect";

import { EmailPayloadCipher } from "#/cipher";
import { EmailError } from "#/errors";

const EncryptionKey = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9+/]{43}=$/));
const purpose = Buffer.from("preface/email-outbox/v1", "utf8");

export const NodeEmailPayloadCipher = {
  layer: Layer.effect(
    EmailPayloadCipher,
    Effect.gen(function* () {
      const secret = yield* Config.schema(Schema.Redacted(EncryptionKey), "EMAIL_ENCRYPTION_KEY");
      const key = Buffer.from(Redacted.value(secret), "base64");
      const crypto = yield* Crypto.Crypto;
      const fingerprintKey = createHmac("sha256", key)
        .update("preface/email-outbox/fingerprint/v1")
        .digest();

      return EmailPayloadCipher.of({
        encrypt: Effect.fn("EmailPayloadCipher.encrypt")(function* (plaintext) {
          const nonce = yield* crypto
            .randomBytes(12)
            .pipe(Effect.mapError(() => new EmailError({ code: "ENCRYPT_FAILED" })));
          return yield* Effect.try({
            try: () => {
              const cipher = createCipheriv("aes-256-gcm", key, nonce);
              cipher.setAAD(purpose);
              const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
              return `v1.${Buffer.from(nonce).toString("base64url")}.${ciphertext.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
            },
            catch: () => new EmailError({ code: "ENCRYPT_FAILED" }),
          });
        }),
        decrypt: Effect.fn("EmailPayloadCipher.decrypt")((ciphertext) =>
          Effect.try({
            try: () => {
              const [version, nonce, body, tag, extra] = ciphertext.split(".");
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
                key,
                Buffer.from(nonce, "base64url"),
              );
              decipher.setAAD(purpose);
              decipher.setAuthTag(Buffer.from(tag, "base64url"));
              return Buffer.concat([
                decipher.update(Buffer.from(body, "base64url")),
                decipher.final(),
              ]).toString("utf8");
            },
            catch: () => new EmailError({ code: "DECRYPT_FAILED" }),
          }),
        ),
        fingerprint: (plaintext) =>
          Effect.sync(() => createHmac("sha256", fingerprintKey).update(plaintext).digest("hex")),
      });
    }),
  ),
} as const;
