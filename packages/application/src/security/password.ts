import type { Effect, Redacted } from "effect";
import { Context } from "effect";

import type { SecurityError } from "#/security/errors";

export class PasswordService extends Context.Service<
  PasswordService,
  {
    readonly hash: (password: Redacted.Redacted<string>) => Effect.Effect<string, SecurityError>;
    readonly verify: (
      password: Redacted.Redacted<string>,
      encodedHash: string,
    ) => Effect.Effect<boolean, SecurityError>;
  }
>()("@usepreface/application/security/PasswordService") {}
