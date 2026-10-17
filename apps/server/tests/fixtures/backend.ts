import { NodeServices } from "@effect/platform-node";
import { ConfigProvider, Effect, Layer } from "effect";

import { Application } from "@usepreface/application";
import { NodePassword, NodeToken } from "@usepreface/application/node";
import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { ServerConfig } from "../../src/config.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;
const database: Layer.Layer<Layer.Success<typeof TestDatabase.layer>, unknown> = port === undefined
  ? TestDatabase.layer
  : TestDatabase.postgresLayer(Number(port));

export const TestConfigLayer = ServerConfig.layer.pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({ PUBLIC_URL: "https://preface.example.test" }),
    ),
  ),
);
const persistence = DatabaseRepository.layer.pipe(Layer.provideMerge(database));
export const BackendTestLayer = Layer.mergeAll(
  Application.layer.pipe(
    Layer.provide(Layer.mergeAll(NodePassword.layer, NodeToken.layer)),
    Layer.provideMerge(persistence),
  ),
  TestConfigLayer,
).pipe(Layer.provide(NodeServices.layer));

export const prepareTestInstance = Effect.gen(function* () {
  yield* (yield* TestDatabase).reset;
  const prepared = yield* (yield* Application).instance.bootstrap.prepare();
  if (prepared.state !== "issued")
    return yield* Effect.die(new Error("Expected a fresh installation"));
  return prepared;
});
