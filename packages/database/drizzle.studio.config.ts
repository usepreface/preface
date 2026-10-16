import { Effect, Redacted } from "effect";

import { defineConfig } from "drizzle-kit";

import { DatabaseConfig } from "#/config";

const database = Effect.runSync(DatabaseConfig);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  dbCredentials: {
    host: database.host,
    port: database.port,
    database: database.database,
    user: database.username,
    password: Redacted.value(database.password),
    ssl: database.ssl,
  },
});
