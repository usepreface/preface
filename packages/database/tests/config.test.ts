import { expect, it } from "@effect/vitest";
import { Config, ConfigProvider, Effect, Redacted } from "effect";

import { DatabaseConfig } from "../src/config.js";

const configuration = {
  POSTGRES_HOST: "127.0.0.1",
  POSTGRES_DATABASE: "preface_test",
  POSTGRES_USERNAME: "preface_test",
  POSTGRES_PASSWORD: "test-configuration-password",
};

it.effect("loads typed defaults and redacts the password", () =>
  Effect.gen(function* () {
    const config = yield* DatabaseConfig;
    expect(config.port).toBe(5432);
    expect(config.ssl).toBe(false);
    expect(config.maxConnections).toBe(10);
    expect(Redacted.value(config.password)).toBe(configuration.POSTGRES_PASSWORD);
    expect(JSON.stringify(config)).not.toContain(configuration.POSTGRES_PASSWORD);
  }).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(configuration)))),
);

it.effect.each([
  ["POSTGRES_PORT", "0"],
  ["POSTGRES_PORT", "65536"],
  ["POSTGRES_PORT", "not-a-port"],
  ["POSTGRES_MAX_CONNECTIONS", "0"],
  ["POSTGRES_CONNECT_TIMEOUT", "not-a-duration"],
  ["POSTGRES_SSL", "not-a-boolean"],
] as const)("rejects invalid configuration %j", ([key, value]) =>
  DatabaseConfig.pipe(
    Effect.flip,
    Effect.tap((failure) => Effect.sync(() => expect(failure).toBeInstanceOf(Config.ConfigError))),
    Effect.provide(
      ConfigProvider.layer(ConfigProvider.fromUnknown({ ...configuration, [key]: value })),
    ),
  ),
);

it.effect("fails when required connection configuration is missing", () =>
  DatabaseConfig.pipe(
    Effect.flip,
    Effect.tap((failure) => Effect.sync(() => expect(failure).toBeInstanceOf(Config.ConfigError))),
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  ),
);
