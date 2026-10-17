import { Context, Effect, Layer, Redacted } from "effect";

import { cryptoPurpose, SecretCrypto } from "@usepreface/crypto";

import { EmailError } from "#/errors";

export class EmailPayloadCipher extends Context.Service<
  EmailPayloadCipher,
  {
    readonly encrypt: (plaintext: string) => Effect.Effect<string, EmailError>;
    readonly decrypt: (ciphertext: string) => Effect.Effect<string, EmailError>;
    readonly fingerprint: (plaintext: string) => Effect.Effect<string, EmailError>;
  }
>()("@usepreface/emails/EmailPayloadCipher") {
  static readonly layer = Layer.effect(
    EmailPayloadCipher,
    Effect.gen(function* () {
      const crypto = yield* SecretCrypto;
      return EmailPayloadCipher.of({
        encrypt: (plaintext) =>
          crypto
            .encrypt({ purpose: cryptoPurpose.emailOutbox, plaintext: Redacted.make(plaintext) })
            .pipe(Effect.mapError(() => new EmailError({ code: "ENCRYPT_FAILED" }))),
        decrypt: (ciphertext) =>
          crypto.decrypt({ purpose: cryptoPurpose.emailOutbox, ciphertext }).pipe(
            Effect.map(Redacted.value),
            Effect.mapError(() => new EmailError({ code: "DECRYPT_FAILED" })),
          ),
        fingerprint: (plaintext) =>
          crypto
            .fingerprint({
              purpose: cryptoPurpose.emailOutboxFingerprint,
              value: Redacted.make(plaintext),
            })
            .pipe(Effect.mapError(() => new EmailError({ code: "ENCRYPT_FAILED" }))),
      });
    }),
  );
}
