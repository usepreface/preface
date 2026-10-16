import { fileURLToPath } from "node:url";

import { Context, Effect, Layer } from "effect";

import { uuid, text } from "drizzle-orm/pg-core";

import {
  authSchema,
  Database,
  generateUuid7,
  instanceSchema,
  mapToDatabaseError,
  timestampColumns,
} from "../../src/index.js";
import { migrateDatabase } from "../../src/migrations/migrate.js";
import { TestDatabase } from "../../src/testing/index.js";

export const instanceProbe = instanceSchema.table("foundation_probe", {
  id: uuid("id").primaryKey().$defaultFn(generateUuid7),
  name: text("name").notNull(),
  ...timestampColumns(),
});

export const authProbe = authSchema.table("foundation_probe", {
  id: uuid("id").primaryKey().$defaultFn(generateUuid7),
  instanceProbeId: uuid("instance_probe_id").notNull(),
});

const makeInstanceRepository = Effect.gen(function* () {
  const database = yield* Database;
  return {
    insert: Effect.fn("InstanceProbeRepository.insert")(function* (name: string) {
      const [probe] = yield* database.insert(instanceProbe).values({ name }).returning();
      if (probe === undefined) return yield* Effect.die("Insert returned no probe");
      return probe;
    }, mapToDatabaseError),
  };
});

export class InstanceProbeRepository extends Context.Service<
  InstanceProbeRepository,
  Effect.Success<typeof makeInstanceRepository>
>()("test/InstanceProbeRepository") {
  static readonly layer = Layer.effect(InstanceProbeRepository, makeInstanceRepository);
}

const makeAuthRepository = Effect.gen(function* () {
  const database = yield* Database;
  return {
    insert: Effect.fn("AuthProbeRepository.insert")(function* (instanceProbeId: string) {
      yield* database.insert(authProbe).values({ instanceProbeId });
    }, mapToDatabaseError),
  };
});

export class AuthProbeRepository extends Context.Service<
  AuthProbeRepository,
  Effect.Success<typeof makeAuthRepository>
>()("test/AuthProbeRepository") {
  static readonly layer = Layer.effect(AuthProbeRepository, makeAuthRepository);
}

export const fixtureMigrations = fileURLToPath(new URL("./migrations/", import.meta.url));
const port = process.env.PREFACE_TEST_POSTGRES_PORT;
const databaseLayer: Layer.Layer<Layer.Success<typeof TestDatabase.layer>, unknown> = port ===
undefined
  ? TestDatabase.layer
  : TestDatabase.postgresLayer(Number(port));

export const DatabaseTestLayer = Layer.mergeAll(
  InstanceProbeRepository.layer,
  AuthProbeRepository.layer,
).pipe(
  Layer.provideMerge(Layer.effectDiscard(migrateDatabase(fixtureMigrations))),
  Layer.provideMerge(databaseLayer),
);
