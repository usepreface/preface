import { NodeCrypto } from "@effect/platform-node";
import { ConfigProvider, Layer } from "effect";

import { NodeSecretCrypto, NodeTokenCrypto } from "@usepreface/crypto/node";
import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";
import { EmailJobs, EmailPayloadCipher } from "@usepreface/emails";

import { Application, AuthenticationLinks } from "../../src/index.js";
import { NodeToken } from "../../src/node/index.js";
import { GoogleTestProvider } from "./google-provider.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;
export const DatabaseTestLayer: Layer.Layer<
  Layer.Success<typeof TestDatabase.layer>,
  unknown
> = port === undefined ? TestDatabase.layer : TestDatabase.postgresLayer(Number(port));

export const RepositoryTestLayer = DatabaseRepository.layer.pipe(
  Layer.provideMerge(DatabaseTestLayer),
);
export const SecurityTestLayer = Layer.mergeAll(
  NodeToken.layer,
  NodeTokenCrypto.layer,
  NodeSecretCrypto.layer,
).pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({
        CRYPTO_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
        CRYPTO_HMAC_KEY: Buffer.alloc(32, 8).toString("base64"),
      }),
    ),
  ),
  Layer.provide(NodeCrypto.layer),
);
export const ApplicationTestLayer = Application.layer.pipe(
  Layer.provideMerge(GoogleTestProvider),
  Layer.provide(
    Layer.succeed(AuthenticationLinks, { publicOrigin: "https://preface.example.test" }),
  ),
  Layer.provideMerge(EmailJobs.layer.pipe(Layer.provideMerge(EmailPayloadCipher.layer))),
  Layer.provideMerge(SecurityTestLayer),
  Layer.provideMerge(RepositoryTestLayer),
);
