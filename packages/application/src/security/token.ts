import type { Effect, Redacted } from "effect";
import { Context } from "effect";

import type { SecurityError } from "#/security/errors";

export interface IssuedToken {
  readonly token: Redacted.Redacted<string>;
  readonly hash: string;
}

export class TokenService extends Context.Service<
  TokenService,
  {
    readonly generateBootstrap: () => Effect.Effect<IssuedToken, SecurityError>;
    readonly generateSession: () => Effect.Effect<IssuedToken, SecurityError>;
    readonly digestBootstrap: (
      token: Redacted.Redacted<string>,
    ) => Effect.Effect<string, SecurityError>;
    readonly digestSession: (
      token: Redacted.Redacted<string>,
    ) => Effect.Effect<string, SecurityError>;
    readonly verifyBootstrap: (
      token: Redacted.Redacted<string>,
      hash: string,
    ) => Effect.Effect<boolean, SecurityError>;
  }
>()("@usepreface/application/security/TokenService") {}
