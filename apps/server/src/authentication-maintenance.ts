import { Effect, Layer } from "effect";

import { Application } from "@usepreface/application";
import { DatabaseRepository } from "@usepreface/database";
import type { IdentityConnectionId } from "@usepreface/protocol";

// Ephemeral proofs retain a short recovery/debug window; audit history lives independently.
export const AuthenticationMaintenanceLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const maintainConnections = (yield* Application).auth.connectionMaintenance;
    const auth = (yield* DatabaseRepository).auth;
    const repository = auth.verification;
    yield* Effect.gen(function* () {
      let cursor: IdentityConnectionId | undefined;
      while (true) {
        const nextCursor = yield* maintainConnections(cursor).pipe(
          Effect.catch(() =>
            Effect.logError("auth.connection_maintenance.failed").pipe(Effect.as(cursor)),
          ),
        );
        cursor = nextCursor;
        const removed = yield* repository
          .deleteExpiredBatch()
          .pipe(
            Effect.catchTag("DatabaseError", () =>
              Effect.logError("auth.proof_cleanup.failed").pipe(Effect.as(0)),
            ),
          );
        const flows = yield* auth.authFlow
          .deleteExpiredBatch()
          .pipe(
            Effect.catchTag("DatabaseError", () =>
              Effect.logError("auth.flow_cleanup.failed").pipe(Effect.as(0)),
            ),
          );
        yield* auth.identityConnectionKey
          .expirePending()
          .pipe(Effect.catchTag("DatabaseError", () => Effect.logError("auth.key_cleanup.failed")));
        const replays = yield* auth.ssoReplay
          .deleteExpiredBatch()
          .pipe(
            Effect.catchTag("DatabaseError", () =>
              Effect.logError("auth.replay_cleanup.failed").pipe(Effect.as(0)),
            ),
          );
        yield* Effect.sleep(
          removed === 500 || flows === 500 || replays === 500 ? "1 second" : "1 minute",
        );
      }
    }).pipe(Effect.forkScoped);
  }),
);
