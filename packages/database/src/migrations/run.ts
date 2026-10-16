import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";

import { Database } from "#/core/layer";
import { runDatabaseMigrations } from "#/migrations/layer";

runDatabaseMigrations().pipe(Effect.provide(Database.layer), NodeRuntime.runMain);
