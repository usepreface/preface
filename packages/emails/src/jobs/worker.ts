import { Effect, Layer } from "effect";

import { EmailDelivery } from "#/jobs/delivery";
import { emailPolicy } from "#/policy";

export const EmailWorkerLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const delivery = yield* EmailDelivery;
    yield* Effect.gen(function* () {
      while (true) {
        const processed = yield* delivery.processOnce.pipe(
          Effect.catchTags({
            DatabaseError: () => Effect.logError("email.worker.database_failed").pipe(Effect.as(0)),
            EmailError: (error) =>
              Effect.logError("email.worker.security_failed").pipe(
                Effect.annotateLogs({ reason: error.code }),
                Effect.as(0),
              ),
          }),
        );
        if (processed === 0) yield* Effect.sleep(emailPolicy.pollInterval);
      }
    }).pipe(Effect.forkScoped);
  }),
);
