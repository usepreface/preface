import { Context, type Effect, type Redacted } from "effect";

import type { CryptoError } from "#/errors";
import type { EncryptionPurpose, FingerprintPurpose } from "#/purposes";

export interface FingerprintInput {
  readonly purpose: FingerprintPurpose;
  readonly value: Redacted.Redacted<string>;
}

export class SecretCrypto extends Context.Service<
  SecretCrypto,
  {
    readonly encrypt: (input: {
      readonly purpose: EncryptionPurpose;
      readonly plaintext: Redacted.Redacted<string>;
    }) => Effect.Effect<string, CryptoError>;
    readonly decrypt: (input: {
      readonly purpose: EncryptionPurpose;
      readonly ciphertext: string;
    }) => Effect.Effect<Redacted.Redacted<string>, CryptoError>;
    readonly fingerprint: (input: FingerprintInput) => Effect.Effect<string, CryptoError>;
    readonly verifyFingerprint: (
      input: FingerprintInput & { readonly expectedFingerprint: string },
    ) => Effect.Effect<boolean, CryptoError>;
  }
>()("@usepreface/crypto/SecretCrypto") {}
