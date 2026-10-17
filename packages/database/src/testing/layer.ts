import { PgliteClient } from "@effect/sql-pglite";
import { ConfigProvider, Context, Effect, Layer } from "effect";

import { sql } from "drizzle-orm";
import * as PgliteDrizzle from "drizzle-orm/effect-pglite";

import { type DatabaseError, mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { TransactionService } from "#/core/transaction";
import { DatabaseMigration } from "#/migrations/layer";
import { migrateDatabase } from "#/migrations/migrate";
import { relations } from "#/relations/index";

const pgliteDatabase = Layer.effect(Database, PgliteDrizzle.makeWithDefaults({ relations })).pipe(
  Layer.provide(PgliteClient.layer()),
);

const pgliteMigrations = Layer.effect(
  DatabaseMigration,
  migrateDatabase().pipe(Effect.as(DatabaseMigration.of({ completed: true }))),
);

export class TestDatabase extends Context.Service<
  TestDatabase,
  { readonly reset: Effect.Effect<void, DatabaseError> }
>()("@usepreface/database/testing/TestDatabase") {
  private static readonly resetLayer = Layer.effect(
    TestDatabase,
    Effect.gen(function* () {
      yield* DatabaseMigration;
      const database = yield* Database;

      const reset = Effect.fn("TestDatabase.reset")(function* () {
        const tables = yield* database.$client<{
          readonly schemaname: string;
          readonly tablename: string;
        }>`select schemaname, tablename from pg_tables
          where schemaname in ('auth', 'instance', 'audit')`;

        if (tables.length === 0) return;
        const names = tables.map(
          (table) => sql`${sql.identifier(table.schemaname)}.${sql.identifier(table.tablename)}`,
        );
        yield* database.execute(
          sql`truncate table ${sql.join(names, sql`, `)} restart identity cascade`,
        );
      }, mapToDatabaseError);

      return TestDatabase.of({ reset: reset() });
    }),
  );

  /** Fresh in-memory database, migrated before dependent services are acquired. */
  static readonly layer = Layer.mergeAll(TestDatabase.resetLayer, TransactionService.layer).pipe(
    Layer.provideMerge(pgliteMigrations),
    Layer.provideMerge(pgliteDatabase),
  );

  /** Only an explicit, disposable loopback test database can use destructive resets. */
  static postgresLayer(port: number) {
    if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 5432) {
      throw new Error("PostgreSQL tests require a dedicated loopback port, not 5432");
    }

    return Layer.mergeAll(TestDatabase.resetLayer, TransactionService.layer).pipe(
      Layer.provideMerge(DatabaseMigration.layer),
      Layer.provideMerge(Database.layer),
      Layer.provide(
        ConfigProvider.layer(
          ConfigProvider.fromUnknown(
            {
              POSTGRES_HOST: "127.0.0.1",
              POSTGRES_PORT: port,
              POSTGRES_DATABASE: "preface_test",
              POSTGRES_USERNAME: "preface_test",
              POSTGRES_PASSWORD: "",
              POSTGRES_SSL: false,
            },
            { preserveEmptyStrings: true },
          ),
        ),
      ),
    );
  }
}
