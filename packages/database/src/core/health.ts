import { Effect } from "effect";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";

export const checkDatabaseConnection = Effect.fn("database.checkConnection")(function* () {
  const database = yield* Database;
  yield* database.$client`select 1`;
}, mapToDatabaseError);
