import assert from "node:assert/strict";
import { test } from "node:test";

import { Effect, Layer } from "effect";

import { Database, DatabaseRepository } from "../../dist/index.js";
import { migrateDatabase } from "../../dist/migrations/migrate.js";
import { TestDatabase } from "../../dist/testing/index.js";

test("built exports apply packaged migrations without deployment configuration", async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      yield* migrateDatabase();
      const database = yield* Database;
      const repository = yield* DatabaseRepository;
      const account = yield* database.query.user.findFirst({
        with: { emails: true, sessions: true, ownerGrants: true, auditEvents: true },
      });

      assert.equal(account, undefined);
      assert.equal(yield* repository.instance.installation.find(), undefined);
      assert.equal(
        yield* repository.auth.userEmail.findActiveByEmail("missing@example.test"),
        undefined,
      );
    }).pipe(Effect.provide(DatabaseRepository.layer.pipe(Layer.provideMerge(TestDatabase.layer)))),
  );
});
