import { expect, it } from "@effect/vitest";
import { Config, ConfigProvider, Effect } from "effect";

import { DatabaseConfig } from "../../src/config.js";

it.effect("keeps the configured password out of serialized configuration", () =>
  Effect.gen(function* () {
    const config = yield* DatabaseConfig;

    expect(JSON.stringify(config)).not.toContain("test-configuration-password");
  }).pipe(
    Effect.provide(
      ConfigProvider.layer(
        ConfigProvider.fromUnknown({
          POSTGRES_HOST: "127.0.0.1",
          POSTGRES_DATABASE: "preface_test",
          POSTGRES_USERNAME: "preface_test",
          POSTGRES_PASSWORD: "test-configuration-password",
        }),
      ),
    ),
  ),
);

it.effect("fails closed when connection configuration is missing", () =>
  Effect.gen(function* () {
    const failure = yield* DatabaseConfig.pipe(Effect.flip);

    expect(failure).toBeInstanceOf(Config.ConfigError);
  }).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({})))),
);
