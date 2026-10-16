import { fileURLToPath } from "node:url";

import { expect, layer } from "@effect/vitest";
import { Cause, Deferred, Effect, Exit, Fiber, Predicate, Result } from "effect";

import { sql } from "drizzle-orm";
import { validate, version } from "uuid";

import { Database, DatabaseError, mapToDatabaseError, TransactionService } from "../src/index.js";
import { migrateDatabase } from "../src/migrations/migrate.js";
import { TestDatabase } from "../src/testing/index.js";
import {
  authProbe,
  AuthProbeRepository,
  DatabaseTestLayer,
  fixtureMigrations,
  instanceProbe,
  InstanceProbeRepository,
} from "./fixtures/database.js";

layer(DatabaseTestLayer)("database foundation", (it) => {
  it.effect("commits writes across repositories and generates UUIDv7 identifiers", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const instance = yield* InstanceProbeRepository;
      const auth = yield* AuthProbeRepository;
      const transaction = yield* TransactionService;
      const database = yield* Database;

      const probe = yield* transaction.run(
        Effect.gen(function* () {
          const inserted = yield* instance.insert("committed");
          yield* auth.insert(inserted.id);
          return inserted;
        }),
      );

      expect(validate(probe.id)).toBe(true);
      expect(version(probe.id)).toBe(7);
      expect(yield* database.select().from(instanceProbe)).toHaveLength(1);
      expect(yield* database.select().from(authProbe)).toHaveLength(1);
    }),
  );

  it.effect("rolls back both repositories and successful nested work on outer failure", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const instance = yield* InstanceProbeRepository;
      const auth = yield* AuthProbeRepository;
      const transaction = yield* TransactionService;
      const database = yield* Database;
      const rejected = { _tag: "BootstrapRejected" } as const;

      const error = yield* transaction
        .run(
          Effect.gen(function* () {
            const probe = yield* instance.insert("rolled-back");
            yield* transaction.run(auth.insert(probe.id));
            expect(yield* database.select().from(authProbe)).toHaveLength(1);
            return yield* Effect.fail(rejected);
          }),
        )
        .pipe(Effect.flip);

      expect(error).toBe(rejected);
      expect(yield* database.select().from(instanceProbe)).toEqual([]);
      expect(yield* database.select().from(authProbe)).toEqual([]);
      yield* instance.insert("connection-reused");
    }),
  );

  it.effect("joins nested runs without implicitly rolling back to a savepoint", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const instance = yield* InstanceProbeRepository;
      const transaction = yield* TransactionService;
      const database = yield* Database;

      yield* transaction.run(
        transaction
          .run(instance.insert("nested").pipe(Effect.andThen(Effect.fail("recoverable"))))
          .pipe(Effect.catch(() => Effect.void)),
      );

      expect(yield* database.select().from(instanceProbe)).toHaveLength(1);
    }),
  );

  it.effect("rolls back interruption and releases the connection", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const instance = yield* InstanceProbeRepository;
      const transaction = yield* TransactionService;
      const database = yield* Database;
      const written = yield* Deferred.make<void>();

      const fiber = yield* transaction
        .run(
          Effect.gen(function* () {
            yield* instance.insert("interrupted");
            yield* Deferred.succeed(written, undefined);
            yield* Effect.never;
          }),
        )
        .pipe(Effect.forkChild);

      yield* Deferred.await(written);
      yield* Fiber.interrupt(fiber);
      expect(yield* database.select().from(instanceProbe)).toEqual([]);
      yield* instance.insert("after-interruption");
    }),
  );

  it.effect("preserves defects while rolling back their writes", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const instance = yield* InstanceProbeRepository;
      const transaction = yield* TransactionService;
      const database = yield* Database;
      const defect = new Error("Unexpected failure");
      const exit = yield* transaction
        .run(instance.insert("defect").pipe(Effect.andThen(Effect.die(defect))))
        .pipe(Effect.exit);

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        expect(Cause.findDefect(exit.cause)).toEqual(Result.succeed(defect));
      }
      expect(yield* database.select().from(instanceProbe)).toEqual([]);
    }),
  );

  it.effect("classifies wrapped unique and foreign-key violations", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const instance = yield* InstanceProbeRepository;
      const auth = yield* AuthProbeRepository;
      const database = yield* Database;
      const inserted = yield* instance.insert("unique");
      const unique = yield* instance.insert("unique").pipe(Effect.flip);
      expect(unique).toBeInstanceOf(DatabaseError);
      expect(unique.reason).toMatchObject({ _tag: "UniqueViolation" });
      if (Predicate.isTagged(unique.reason, "UniqueViolation")) {
        expect(unique.reason.constraint).toBe("foundation_probe_name_unique");
      }
      expect(unique.message).not.toContain("params:");
      expect(unique.isRetryable).toBe(false);

      yield* database.delete(instanceProbe);
      const foreignKey = yield* auth.insert(inserted.id).pipe(Effect.flip);
      expect(foreignKey.reason).toMatchObject({ _tag: "ConstraintError" });
    }),
  );

  it.effect("round-trips timestamp instants through Drizzle codecs", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const database = yield* Database;
      const instant = new Date("2026-10-16T08:42:13.123+05:30");
      const [inserted] = yield* database
        .insert(instanceProbe)
        .values({
          name: "timestamp",
          createdAt: instant,
          updatedAt: instant,
        })
        .returning();

      expect(inserted?.createdAt).toEqual(instant);
      expect(inserted?.updatedAt).toEqual(instant);
      const [selected] = yield* database.select().from(instanceProbe);
      expect(selected?.createdAt.toISOString()).toBe(instant.toISOString());
    }),
  );

  it.effect("runs real migrations idempotently and preserves history on reset", () =>
    Effect.gen(function* () {
      const database = yield* Database;
      const before = yield* database.execute(
        sql`select name from drizzle.__drizzle_migrations order by name`,
      );
      yield* migrateDatabase();
      yield* migrateDatabase(fixtureMigrations);
      yield* (yield* TestDatabase).reset;
      const after = yield* database.execute(
        sql`select name from drizzle.__drizzle_migrations order by name`,
      );
      expect(after).toEqual(before);
      const schemas = yield* database.$client<{ readonly schema_name: string }>`
        select schema_name from information_schema.schemata where schema_name in ('auth', 'instance')
        order by schema_name`;
      expect(schemas.map((schema) => schema.schema_name)).toEqual(["auth", "instance"]);
    }),
  );

  it.effect("fails with DatabaseError when migration files are missing", () =>
    Effect.gen(function* () {
      const failure = yield* migrateDatabase("/nonexistent/preface-test-migrations").pipe(
        Effect.flip,
      );
      expect(failure).toBeInstanceOf(DatabaseError);
    }),
  );

  it.effect("maps raw SQL failures without erasing their structured reason", () =>
    Effect.gen(function* () {
      const database = yield* Database;
      const failure = yield* database.$client`select * from missing_foundation_table`.pipe(
        mapToDatabaseError,
        Effect.flip,
      );
      expect(failure).toBeInstanceOf(DatabaseError);
      expect(failure.reason).toBeDefined();
    }),
  );

  it.effect("fails a broken migration and rolls back its DDL and history entry", () =>
    Effect.gen(function* () {
      const database = yield* Database;
      const folder = fileURLToPath(new URL("./fixtures/failing-migrations/", import.meta.url));
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
