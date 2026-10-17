import { Layer } from "effect";

import { NodeSecretCrypto } from "@usepreface/crypto/node";

import { EmailPayloadCipher } from "#/cipher";

// Compatibility composition; cryptographic implementation lives in @usepreface/crypto.
export const NodeEmailPayloadCipher = {
  layer: EmailPayloadCipher.layer.pipe(Layer.provide(NodeSecretCrypto.layer)),
} as const;
