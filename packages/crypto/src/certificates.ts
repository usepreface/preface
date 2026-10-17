import { Context, type DateTime, type Effect, type Redacted } from "effect";

import type { CryptoError } from "#/errors";

export class CertificateCrypto extends Context.Service<
  CertificateCrypto,
  {
    readonly generateSigningCertificate: () => Effect.Effect<
      {
        readonly privateKey: Redacted.Redacted<string>;
        readonly certificate: string;
        readonly expiresAt: DateTime.Utc;
      },
      CryptoError
    >;
    readonly validateSigningCertificates: (
      certificates: readonly string[],
    ) => Effect.Effect<readonly string[], CryptoError>;
  }
>()("@usepreface/crypto/CertificateCrypto") {}
