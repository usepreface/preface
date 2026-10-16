import { expect, it } from "@effect/vitest";
import { Deferred, Effect, Fiber, Schedule } from "effect";

import { Database, DatabaseError, runDatabaseMigrations } from "../src/index.js";
import { TestDatabase } from "../src/testing/index.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;

it.live.skipIf(port === undefined)("serializes migrations behind a transaction advisory lock", () =>
  Effect.gen(function* () {
    const database = yield* Database;
    const client = database.$client;
    const locked = yield* Deferred.make<void>();
    const release = yield* Deferred.make<void>();

    const holder = yield* client
      .withTransaction(
        Effect.gen(function* () {
          yield* client`select pg_advisory_xact_lock(hashtext('preface_database_migrations'))`;
          yield* Deferred.succeed(locked, undefined);
          yield* Deferred.await(release);
        }),
      )
      .pipe(Effect.forkChild);
    yield* Deferred.await(locked);

    const migration = yield* runDatabaseMigrations().pipe(Effect.forkChild);
    yield* client<{ readonly count: number }>`
      select count(*)::int as count from pg_stat_activity
      where application_name = 'preface' and wait_event = 'advisory'`.pipe(
      Effect.flatMap((rows) =>
        rows[0]?.count === 1 ? Effect.void : Effect.fail("Not waiting yet"),
      ),
      Effect.retry({ times: 100, schedule: Schedule.spaced("10 millis") }),
    );

    yield* Deferred.succeed(release, undefined);
    yield* Fiber.join(holder);
    yield* Fiber.join(migration);
    yield* runDatabaseMigrations();
    const locks = yield* client`select 1 from pg_locks
      where locktype = 'advisory' and pid in
        (select pid from pg_stat_activity where application_name = 'preface')`;
    expect(locks).toEqual([]);
  }).pipe(Effect.provide(TestDatabase.postgresLayer(Number(port)))),
);

it.live.skipIf(port === undefined)(
  "rejects migration execution inside an existing transaction",
  () =>
    Effect.gen(function* () {
      const database = yield* Database;
      const failure = yield* database.$client
        .withTransaction(runDatabaseMigrations())
        .pipe(Effect.flip);
      expect(failure).toBeInstanceOf(DatabaseError);
      expect(failure.cause).toBeInstanceOf(Error);
    }).pipe(Effect.provide(TestDatabase.postgresLayer(Number(port)))),
);
