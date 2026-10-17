import { expect, it } from "@effect/vitest";
import { DateTime, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { EmailJobs } from "../../src/index.js";
import { EmailTestLayer, signInEmail } from "../fixtures/email.js";

it.effect.skipIf(process.env.PREFACE_TEST_POSTGRES_PORT === undefined)(
  "concurrent PostgreSQL workers cannot claim the same email",
  () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      yield* (yield* EmailJobs).enqueue(yield* signInEmail);
      const repository = (yield* DatabaseRepository).jobs.email;
      const leaseExpiresAt = DateTime.addDuration(yield* DateTime.now, "30 seconds");
      const replayAfter = DateTime.subtractDuration(yield* DateTime.now, "1 hour");

      const claims = yield* Effect.all(
        [
          repository.claim({
            leaseToken: "worker-a",
            leaseExpiresAt,
            maximumAttempts: 5,
            provider: "resend",
            supportsIdempotency: true,
            replayAfter,
          }),
          repository.claim({
            leaseToken: "worker-b",
            leaseExpiresAt,
            maximumAttempts: 5,
            provider: "resend",
            supportsIdempotency: true,
            replayAfter,
          }),
        ],
        { concurrency: 2 },
      );

      expect(claims.filter((claim) => claim !== undefined)).toHaveLength(1);
    }).pipe(Effect.provide(EmailTestLayer)),
);
