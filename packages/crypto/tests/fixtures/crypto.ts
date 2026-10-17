import { NodeCrypto } from "@effect/platform-node";
import { ConfigProvider, Layer } from "effect";

import { NodeSecretCrypto, NodeTokenCrypto } from "../../src/node/index.js";

export const CryptoTestLayer = Layer.mergeAll(NodeTokenCrypto.layer, NodeSecretCrypto.layer).pipe(
  Layer.provide(NodeCrypto.layer),
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({
        EMAIL_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
        CRYPTO_HMAC_KEY: Buffer.alloc(32, 8).toString("base64"),
      }),
    ),
  ),
);
