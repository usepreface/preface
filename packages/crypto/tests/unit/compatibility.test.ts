import { createCipheriv, createHash, createHmac } from "node:crypto";

import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";

import { cryptoPurpose, SecretCrypto, TokenCrypto } from "../../src/index.js";
import { CryptoTestLayer } from "../fixtures/crypto.js";

layer(CryptoTestLayer)("shared cryptographic boundaries", (it) => {
  it.effect("preserves existing token digests and separates credential purposes", () =>
    Effect.gen(function* () {
      const crypto = yield* TokenCrypto;
      const token = Redacted.make("bs1_compatibility-fixture");
      const expectedDigest = createHash("sha256")
        .update("preface:bootstrap:v1\0bs1_compatibility-fixture")
        .digest("hex");
      expect(yield* crypto.digestToken({ purpose: cryptoPurpose.bootstrapToken, token })).toBe(
        expectedDigest,
      );
      expect(
        yield* crypto.verifyToken({ purpose: cryptoPurpose.bootstrapToken, token, expectedDigest }),
      ).toBe(true);
      expect(
        yield* crypto.verifyToken({ purpose: cryptoPurpose.sessionToken, token, expectedDigest }),
      ).toBe(false);
      expect(
        yield* crypto.verifyToken({
          purpose: cryptoPurpose.bootstrapToken,
          token,
          expectedDigest: "invalid",
        }),
      ).toBe(false);
      const code = yield* crypto.randomCode();
      expect(Redacted.value(code)).toMatch(/^\d{8}$/);
      expect(JSON.stringify({ code })).not.toContain(Redacted.value(code));
    }),
  );

  it.effect(
    "reads the previous outbox format and preserves its fingerprint while authenticating ciphertext",
    () =>
      Effect.gen(function* () {
        const crypto = yield* SecretCrypto;
        const key = Buffer.alloc(32, 7);
        const nonce = Buffer.alloc(12, 1);
        const cipher = createCipheriv("aes-256-gcm", key, nonce);
        cipher.setAAD(Buffer.from("preface/email-outbox/v1"));
        const body = Buffer.concat([cipher.update("legacy outbox fixture"), cipher.final()]);
        const encoded = `v1.${nonce.toString("base64url")}.${body.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}`;
        const plaintext = yield* crypto.decrypt({
          purpose: cryptoPurpose.emailOutbox,
          ciphertext: encoded,
        });
        expect(Redacted.value(plaintext)).toBe("legacy outbox fixture");
        const fingerprintKey = createHmac("sha256", key)
          .update("preface/email-outbox/fingerprint/v1")
          .digest();
        expect(
          yield* crypto.fingerprint({
            purpose: cryptoPurpose.emailOutboxFingerprint,
            value: plaintext,
          }),
        ).toBe(createHmac("sha256", fingerprintKey).update("legacy outbox fixture").digest("hex"));
        const tampered = encoded.split(".");
        tampered[2] = Buffer.from("tampered").toString("base64url");
        const failure = yield* crypto
          .decrypt({ purpose: cryptoPurpose.emailOutbox, ciphertext: tampered.join(".") })
          .pipe(Effect.flip);
        expect(failure.operation).toBe("decrypt");
        const code = Redacted.make("fixture-id:48271936");
        const fingerprint = yield* crypto.fingerprint({
          purpose: cryptoPurpose.setupVerificationCode,
          value: code,
        });
        expect(
          yield* crypto.verifyFingerprint({
            purpose: cryptoPurpose.setupVerificationCode,
            value: code,
            expectedFingerprint: fingerprint,
          }),
        ).toBe(true);
        expect(
          yield* crypto.verifyFingerprint({
            purpose: cryptoPurpose.setupVerificationCode,
            value: Redacted.make("other-id:48271936"),
            expectedFingerprint: fingerprint,
          }),
        ).toBe(false);
      }),
  );
});
