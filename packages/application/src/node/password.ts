import { Effect, Layer, Redacted, Semaphore } from "effect";

import { hash, verify } from "@node-rs/argon2";
import type { Options } from "@node-rs/argon2";

import { SecurityError } from "#/security/errors";
import { PasswordService } from "#/security/password";

const options = {
  // Native const enums cannot be imported with verbatimModuleSyntax: Argon2id, v1.3.
  algorithm: 2,
  version: 1,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const satisfies Options;

export const NodePassword = {
  layer: Layer.effect(
    PasswordService,
    Effect.gen(function* () {
      const concurrency = yield* Semaphore.make(2);

      return PasswordService.of({
        hash: Effect.fn("PasswordService.hash")((password) =>
          Effect.tryPromise({
            try: (signal) => hash(Redacted.value(password), options, signal),
            catch: () => new SecurityError({ operation: "password_hash" }),
          }).pipe(concurrency.withPermits(1)),
        ),
        verify: Effect.fn("PasswordService.verify")((password, encodedHash) =>
          Effect.tryPromise({
            try: (signal) => verify(encodedHash, Redacted.value(password), undefined, signal),
            catch: () => new SecurityError({ operation: "password_verify" }),
          }).pipe(concurrency.withPermits(1)),
        ),
      });
    }),
  ),
} as const;
