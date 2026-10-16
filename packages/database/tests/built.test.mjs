import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { Effect } from "effect";

import { Database } from "../dist/index.js";
import { migrationsFolder, migrateDatabase } from "../dist/migrations/migrate.js";
import { TestDatabase } from "../dist/testing/index.js";

test("built exports load and apply packaged migrations without deployment configuration", async () => {
  assert.ok(existsSync(migrationsFolder));
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* migrateDatabase();
      const database = yield* Database;
      const schemas = yield* database.$client`
        select schema_name from information_schema.schemata
        where schema_name in ('auth', 'instance') order by schema_name`;
      assert.deepEqual(
        schemas.map((schema) => schema.schema_name),
        ["auth", "instance"],
      );
      const tables = yield* database.$client`
        select schemaname, tablename from pg_tables where schemaname in ('auth', 'instance')
        order by schemaname, tablename`;
      assert.deepEqual(tables, [
        { schemaname: "instance", tablename: "installation" },
        { schemaname: "instance", tablename: "owner" },
        { schemaname: "instance", tablename: "settings" },
      ]);
      assert.equal(yield* database.query.installation.findFirst(), undefined);
    }).pipe(Effect.provide(TestDatabase.layer)),
  );
});
