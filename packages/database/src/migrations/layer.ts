import { Context, Effect, Layer, Option } from "effect";

import { DatabaseError, mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { migrateDatabase } from "#/migrations/migrate";

export const runDatabaseMigrations = Effect.fn("database.runMigrations")(function* () {
  const database = yield* Database;
  const client = database.$client;
  const active = yield* Effect.serviceOption(client.transactionService);
  if (Option.isSome(active)) {
    return yield* new DatabaseError({
      cause: new Error("Migrations must run outside an existing transaction"),
    });
  }

  // The transaction lock and all migration queries use the same reserved connection.
  yield* client.withTransaction(
    Effect.gen(function* () {
      yield* client`select pg_advisory_xact_lock(hashtext('preface_database_migrations'))`;
      yield* migrateDatabase();
    }),
  );
}, mapToDatabaseError);

export class DatabaseMigration extends Context.Service<
  DatabaseMigration,
  { readonly completed: true }
>()("@usepreface/database/migrations/DatabaseMigration") {
  static readonly layer = Layer.effect(
    DatabaseMigration,
    runDatabaseMigrations().pipe(Effect.as(DatabaseMigration.of({ completed: true }))),
  );
}
