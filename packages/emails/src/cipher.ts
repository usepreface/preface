import { Context, type Effect } from "effect";

import type { EmailError } from "#/errors";

export class EmailPayloadCipher extends Context.Service<
  EmailPayloadCipher,
  {
    readonly encrypt: (plaintext: string) => Effect.Effect<string, EmailError>;
    readonly decrypt: (ciphertext: string) => Effect.Effect<string, EmailError>;
    readonly fingerprint: (plaintext: string) => Effect.Effect<string, EmailError>;
  }
>()("@usepreface/emails/EmailPayloadCipher") {}
