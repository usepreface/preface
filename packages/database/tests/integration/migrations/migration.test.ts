import { fileURLToPath } from "node:url";

import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { Database, DatabaseError } from "../../../src/index.js";
import { migrateDatabase } from "../../../src/migrations/migrate.js";
import { DatabaseTestLayer } from "../../fixtures/database.js";

layer(DatabaseTestLayer)("migration failure", (it) => {
  it.effect("fails a broken migration and rolls back its DDL and history entry", () =>
    Effect.gen(function* () {
      const database = yield* Database;
      const folder = fileURLToPath(new URL("../../fixtures/failing-migrations/", import.meta.url));
      const error = yield* migrateDatabase(folder).pipe(Effect.flip);
      expect(error).toBeInstanceOf(DatabaseError);
      const [probe] = yield* database.$client<{ readonly name: string | null }>`
        select to_regclass('instance.failed_migration_probe')::text as name`;
      expect(probe?.name).toBeNull();
      const history = yield* database.$client`select name from drizzle.__drizzle_migrations
        where name = '20261016000001_broken'`;
      expect(history).toEqual([]);
    }),
  );
});
