import { Context, Effect, Layer, Option } from "effect";
import type { SqlError } from "effect/sql";

import { mapToDatabaseError, type MapDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";

export class TransactionService extends Context.Service<
  TransactionService,
  {
    readonly run: <A, E, R>(
      effect: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, MapDatabaseError<E | SqlError.SqlError>, R>;
  }
>()("@usepreface/database/core/TransactionService") {
  static readonly layer = Layer.effect(
    TransactionService,
    Effect.gen(function* () {
      const database = yield* Database;
      const client = database.$client;

      return TransactionService.of({
        run: (effect) =>
          Effect.serviceOption(client.transactionService).pipe(
            // Joining deliberately does not introduce a nested savepoint.
            Effect.flatMap((active) =>
              Option.isSome(active) ? effect : client.withTransaction(effect),
            ),
            mapToDatabaseError,
          ),
      });
    }),
  );
}
