import { fileURLToPath } from "node:url";

import { Effect } from "effect";

import { migrate } from "drizzle-orm/effect-postgres/migrator";

import { DatabaseError, mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";

export const migrationsFolder = fileURLToPath(new URL("../../migrations/", import.meta.url));

export const migrateDatabase: (folder?: string) => Effect.Effect<void, DatabaseError, Database> =
  Effect.fn("database.migrate")(function* (folder: string = migrationsFolder) {
    const database = yield* Database;
    // The Drizzle migrator reads files synchronously before returning its Effect.
    const migration = yield* Effect.try({
      try: () => migrate(database, { migrationsFolder: folder }),
      catch: (cause) => new DatabaseError({ cause }),
    });
    yield* migration;
  }, mapToDatabaseError);
