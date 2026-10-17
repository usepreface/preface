import { Context, type Effect, type Redacted } from "effect";

import type { CryptoError } from "#/errors";
import type { TokenPurpose } from "#/purposes";

export interface TokenDigestInput {
  readonly purpose: TokenPurpose;
  readonly token: Redacted.Redacted<string>;
}

export class TokenCrypto extends Context.Service<
  TokenCrypto,
  {
    readonly randomToken: () => Effect.Effect<Redacted.Redacted<string>, CryptoError>;
    readonly pkceChallenge: (
      verifier: Redacted.Redacted<string>,
    ) => Effect.Effect<string, CryptoError>;
    readonly randomCode: () => Effect.Effect<Redacted.Redacted<string>, CryptoError>;
    readonly digestToken: (input: TokenDigestInput) => Effect.Effect<string, CryptoError>;
    readonly verifyToken: (
      input: TokenDigestInput & { readonly expectedDigest: string },
    ) => Effect.Effect<boolean, CryptoError>;
  }
>()("@usepreface/crypto/TokenCrypto") {}
