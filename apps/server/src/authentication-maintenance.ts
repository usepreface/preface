import { Effect, Layer } from "effect";

import { DatabaseRepository } from "@usepreface/database";

// Ephemeral proofs retain a short recovery/debug window; audit history lives independently.
export const AuthenticationMaintenanceLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const repository = (yield* DatabaseRepository).auth.verification;
    yield* Effect.gen(function* () {
      while (true) {
        const removed = yield* repository
          .deleteExpiredBatch()
          .pipe(
            Effect.catchTag("DatabaseError", () =>
              Effect.logError("auth.proof_cleanup.failed").pipe(Effect.as(0)),
            ),
          );
        yield* Effect.sleep(removed === 500 ? "1 second" : "1 hour");
      }
    }).pipe(Effect.forkScoped);
  }),
);
