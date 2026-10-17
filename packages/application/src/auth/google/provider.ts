import { Context, type Effect, type Redacted, Schema } from "effect";

import { GoogleSubject, type IdentityError } from "@usepreface/protocol";
export const GoogleIdentityClaims = Schema.Struct({
  subject: GoogleSubject,
  email: Schema.NullOr(Schema.String),
  emailVerified: Schema.NullOr(Schema.Boolean),
});
export type GoogleIdentityClaims = typeof GoogleIdentityClaims.Type;
export interface GoogleClient {
  readonly clientId: string;
  readonly clientSecret: Redacted.Redacted<string>;
  readonly redirectUri: string;
}
export class GoogleIdentity extends Context.Service<
  GoogleIdentity,
  {
    readonly authorizationUrl: (
      input: GoogleClient & {
        readonly state: Redacted.Redacted<string>;
        readonly nonce: Redacted.Redacted<string>;
        readonly codeChallenge: string;
      },
    ) => Effect.Effect<string, IdentityError>;
    readonly exchangeAndVerify: (
      input: GoogleClient & {
        readonly code: Redacted.Redacted<string>;
        readonly state: Redacted.Redacted<string>;
        readonly nonce: Redacted.Redacted<string>;
        readonly verifier: Redacted.Redacted<string>;
      },
    ) => Effect.Effect<GoogleIdentityClaims, IdentityError>;
  }
>()("@usepreface/application/auth/GoogleIdentity") {}
