import { Effect, Layer, Redacted } from "effect";

import { cryptoPurpose, TokenCrypto } from "@usepreface/crypto";
import { NodeTokenCrypto } from "@usepreface/crypto/node";

import { SecurityError } from "#/security/errors";
import { TokenService } from "#/security/token";

export const NodeToken = {
  layer: Layer.effect(
    TokenService,
    Effect.gen(function* () {
      const crypto = yield* TokenCrypto;
      const generate = Effect.fn("TokenService.generate")(function* (
        purpose: "bootstrap" | "session",
      ) {
        const random = yield* crypto
          .randomToken()
          .pipe(Effect.mapError(() => new SecurityError({ operation: "token_generate" })));
        const token = Redacted.make(
          `${purpose === "bootstrap" ? "bs1" : "ss1"}_${Redacted.value(random)}`,
        );
        const hash = yield* crypto
          .digestToken({
            purpose:
              purpose === "bootstrap" ? cryptoPurpose.bootstrapToken : cryptoPurpose.sessionToken,
            token,
          })
          .pipe(Effect.mapError(() => new SecurityError({ operation: "token_digest" })));
        return { token, hash };
      });

      return TokenService.of({
        generateBootstrap: () => generate("bootstrap"),
        generateSession: () => generate("session"),
        digestBootstrap: (token) =>
          crypto
            .digestToken({ purpose: cryptoPurpose.bootstrapToken, token })
            .pipe(Effect.mapError(() => new SecurityError({ operation: "token_digest" }))),
        digestSession: (token) =>
          crypto
            .digestToken({ purpose: cryptoPurpose.sessionToken, token })
            .pipe(Effect.mapError(() => new SecurityError({ operation: "token_digest" }))),
        verifyBootstrap: (token, hash) =>
          crypto
            .verifyToken({ purpose: cryptoPurpose.bootstrapToken, token, expectedDigest: hash })
            .pipe(Effect.mapError(() => new SecurityError({ operation: "token_digest" }))),
      });
    }),
  ).pipe(Layer.provide(NodeTokenCrypto.layer)),
} as const;
