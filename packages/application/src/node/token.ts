import { timingSafeEqual } from "node:crypto";

import { Crypto, Effect, Layer, Redacted } from "effect";

import { SecurityError } from "#/security/errors";
import { TokenService } from "#/security/token";

export const NodeToken = {
  layer: Layer.effect(
    TokenService,
    Effect.gen(function* () {
      const crypto = yield* Crypto.Crypto;

      const digest = Effect.fn("TokenService.digest")(function* (
        purpose: "bootstrap" | "session",
        token: Redacted.Redacted<string>,
      ) {
        const input = new TextEncoder().encode(`preface:${purpose}:v1\0${Redacted.value(token)}`);
        const bytes = yield* crypto
          .digest("SHA-256", input)
          .pipe(Effect.mapError(() => new SecurityError({ operation: "token_digest" })));
        return Buffer.from(bytes).toString("hex");
      });

      const generate = Effect.fn("TokenService.generate")(function* (
        purpose: "bootstrap" | "session",
      ) {
        const bytes = yield* crypto
          .randomBytes(32)
          .pipe(Effect.mapError(() => new SecurityError({ operation: "token_generate" })));
        const token = Redacted.make(
          `${purpose === "bootstrap" ? "bs1" : "ss1"}_${Buffer.from(bytes).toString("base64url")}`,
        );
        return { token, hash: yield* digest(purpose, token) };
      });

      return TokenService.of({
        generateBootstrap: () => generate("bootstrap"),
        generateSession: () => generate("session"),
        digestBootstrap: (token) => digest("bootstrap", token),
        digestSession: (token) => digest("session", token),
        verifyBootstrap: Effect.fn("TokenService.verifyBootstrap")(function* (token, hash) {
          const actual = Buffer.from(yield* digest("bootstrap", token), "utf8");
          const expected = Buffer.from(hash, "utf8");
          return actual.length === expected.length && timingSafeEqual(actual, expected);
        }),
      });
    }),
  ),
} as const;
