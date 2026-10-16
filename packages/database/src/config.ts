import { Config, Schema } from "effect";

export const databaseConfig = {
  host: Config.NonEmptyString("POSTGRES_HOST"),
  port: Config.schema(
    Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 65535 })),
    "POSTGRES_PORT",
  ).pipe(Config.withDefault(5432)),
  database: Config.NonEmptyString("POSTGRES_DATABASE"),
  username: Config.NonEmptyString("POSTGRES_USERNAME"),
  password: Config.Redacted("POSTGRES_PASSWORD"),
  ssl: Config.Boolean("POSTGRES_SSL").pipe(Config.withDefault(false)),
  maxConnections: Config.schema(
    Schema.Int.check(Schema.isGreaterThan(0)),
    "POSTGRES_MAX_CONNECTIONS",
  ).pipe(Config.withDefault(10)),
  connectTimeout: Config.Duration("POSTGRES_CONNECT_TIMEOUT").pipe(
    Config.withDefault("10 seconds"),
  ),
  idleTimeout: Config.Duration("POSTGRES_IDLE_TIMEOUT").pipe(Config.withDefault("60 seconds")),
};

export const DatabaseConfig = Config.all(databaseConfig);
