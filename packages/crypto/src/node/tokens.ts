import { timingSafeEqual } from "node:crypto";

import { Crypto, Effect, Layer, Redacted } from "effect";

import { CryptoError } from "#/errors";
import { TokenCrypto, type TokenDigestInput } from "#/tokens";

export const NodeTokenCrypto = {
  layer: Layer.effect(
    TokenCrypto,
    Effect.gen(function* () {
      const crypto = yield* Crypto.Crypto;
      const digestToken = Effect.fn("TokenCrypto.digestToken")(function* (input: TokenDigestInput) {
        // Preserve the existing bootstrap/session digest framing and hex encoding.
        const bytes = new TextEncoder().encode(`${input.purpose}\0${Redacted.value(input.token)}`);
        const digest = yield* crypto
          .digest("SHA-256", bytes)
          .pipe(Effect.mapError(() => new CryptoError({ operation: "digest" })));
        return Buffer.from(digest).toString("hex");
      });

      return TokenCrypto.of({
        randomToken: Effect.fn("TokenCrypto.randomToken")(function* () {
          const bytes = yield* crypto
            .randomBytes(32)
            .pipe(Effect.mapError(() => new CryptoError({ operation: "random" })));
          return Redacted.make(Buffer.from(bytes).toString("base64url"));
        }),
        randomCode: Effect.fn("TokenCrypto.randomCode")(function* () {
          const code = yield* Effect.all(
            Array.from({ length: 8 }, () => crypto.randomIntBetween(0, 10, { halfOpen: true })),
          ).pipe(Effect.mapError(() => new CryptoError({ operation: "random" })));
          return Redacted.make(code.join(""));
        }),
        pkceChallenge: Effect.fn("TokenCrypto.pkceChallenge")(function* (verifier) {
          const digest = yield* crypto
            .digest("SHA-256", new TextEncoder().encode(Redacted.value(verifier)))
            .pipe(Effect.mapError(() => new CryptoError({ operation: "digest" })));
          return Buffer.from(digest).toString("base64url");
        }),
        digestToken,
        verifyToken: Effect.fn("TokenCrypto.verifyToken")(function* (input) {
          const actual = Buffer.from(yield* digestToken(input), "utf8");
          const expected = Buffer.from(input.expectedDigest, "utf8");
          return actual.length === expected.length && timingSafeEqual(actual, expected);
        }),
      });
    }),
  ),
} as const;
