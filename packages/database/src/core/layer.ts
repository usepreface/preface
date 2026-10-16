import { PgClient } from "@effect/sql-pg";
import { Config, Context, Effect, Layer } from "effect";
import type { SqlClient } from "effect/sql";

import * as PgDrizzle from "drizzle-orm/effect-postgres";

import { databaseConfig } from "#/config";
import { mapToDatabaseError } from "#/core/errors";
import { relations } from "#/relations/index";

export type DatabaseService = PgDrizzle.EffectPgDatabase<typeof relations> & {
  readonly $client: SqlClient.SqlClient;
};

export const makeDatabase = PgDrizzle.makeWithDefaults({ relations });

export class Database extends Context.Service<Database, DatabaseService>()(
  "@usepreface/database/core/Database",
) {
  static readonly layer = Layer.effect(Database, makeDatabase).pipe(
    Layer.provide(
      PgClient.layerFrom(
        Config.unwrap({ ...databaseConfig, applicationName: Config.succeed("preface") }).pipe(
          Effect.flatMap(PgClient.make),
          mapToDatabaseError,
        ),
      ),
    ),
  );
}
