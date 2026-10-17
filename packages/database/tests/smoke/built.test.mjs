import assert from "node:assert/strict";
import { test } from "node:test";

import { Effect } from "effect";

import { Database } from "../../dist/index.js";
import { migrateDatabase } from "../../dist/migrations/migrate.js";
import { TestDatabase } from "../../dist/testing/index.js";

test("built exports apply packaged migrations without deployment configuration", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* migrateDatabase();
      const database = yield* Database;
      const account = yield* database.query.user.findFirst({
        with: { passwordCredential: true, sessions: true, ownerGrants: true, auditEvents: true },
      });

      assert.equal(account, undefined);
      assert.equal(yield* database.query.installation.findFirst(), undefined);
    }).pipe(Effect.provide(TestDatabase.layer)),
  );
});
