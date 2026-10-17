import { NodeServices } from "@effect/platform-node";
import { ConfigProvider, Effect, Layer } from "effect";

import { Application } from "@usepreface/application";
import { NodeToken } from "@usepreface/application/node";
import { NodeSecretCrypto, NodeTokenCrypto } from "@usepreface/crypto/node";
import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";
import { EmailJobs, EmailPayloadCipher } from "@usepreface/emails";

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
    Layer.provideMerge(EmailJobs.layer.pipe(Layer.provideMerge(EmailPayloadCipher.layer))),
    Layer.provide(
      Layer.mergeAll(NodeToken.layer, NodeTokenCrypto.layer, NodeSecretCrypto.layer).pipe(
        Layer.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              CRYPTO_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
              CRYPTO_HMAC_KEY: Buffer.alloc(32, 8).toString("base64"),
            }),
          ),
        ),
      ),
    ),
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
