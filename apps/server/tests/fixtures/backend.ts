import { NodeServices } from "@effect/platform-node";
import { ConfigProvider, Effect, Layer } from "effect";

import { Application, AuthenticationLinks, type OidcIdentity } from "@usepreface/application";
import {
  NodeToken,
  NodeGoogleIdentity,
  NodeOidcIdentity,
  NodeSamlIdentity,
  NodeDomainDns,
} from "@usepreface/application/node";
import { NodeSecretCrypto, NodeTokenCrypto, NodeCertificateCrypto } from "@usepreface/crypto/node";
import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";
import { EmailJobs, EmailPayloadCipher } from "@usepreface/emails";

import { ServerConfig } from "../../src/config.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;
const database: Layer.Layer<Layer.Success<typeof TestDatabase.layer>, unknown> = port === undefined
  ? TestDatabase.layer
  : TestDatabase.postgresLayer(Number(port));

const makeTestConfigLayer = (publicOrigin: string) =>
  ServerConfig.layer.pipe(
    Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ PUBLIC_URL: publicOrigin }))),
  );
export const TestConfigLayer = makeTestConfigLayer("https://preface.example.test");
const persistence = DatabaseRepository.layer.pipe(Layer.provideMerge(database));
export const makeBackendTestLayer = (
  oidc: Layer.Layer<OidcIdentity> = NodeOidcIdentity.layer(),
  publicOrigin = "https://preface.example.test",
) =>
  Layer.mergeAll(
    Application.layer.pipe(
      Layer.provide(NodeGoogleIdentity.layer),
      Layer.provide(oidc),
      Layer.provide(NodeSamlIdentity.layer),
      Layer.provide(NodeDomainDns.layer),
      Layer.provide(Layer.succeed(AuthenticationLinks, { publicOrigin })),
      Layer.provideMerge(EmailJobs.layer.pipe(Layer.provideMerge(EmailPayloadCipher.layer))),
      Layer.provide(
        Layer.mergeAll(
          NodeToken.layer,
          NodeTokenCrypto.layer,
          NodeSecretCrypto.layer,
          NodeCertificateCrypto.layer,
        ).pipe(
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
    makeTestConfigLayer(publicOrigin),
  ).pipe(Layer.provide(NodeServices.layer));

export const BackendTestLayer = makeBackendTestLayer();

export const prepareTestInstance = Effect.gen(function* () {
  yield* (yield* TestDatabase).reset;
  const prepared = yield* (yield* Application).instance.bootstrap.prepare();
  if (prepared.state !== "issued")
    return yield* Effect.die(new Error("Expected a fresh installation"));
  return prepared;
});
