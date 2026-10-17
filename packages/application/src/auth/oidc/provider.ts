import { Context, type Effect, type Redacted, Schema } from "effect";

import type { IdentityError } from "@usepreface/protocol";
import type { OidcConfiguration } from "@usepreface/protocol/model";

export const OidcIdentityClaims = Schema.Struct({
  issuer: Schema.String,
  subject: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(255)),
  email: Schema.NullOr(Schema.String),
  emailVerified: Schema.NullOr(Schema.Boolean),
});
export type OidcIdentityClaims = typeof OidcIdentityClaims.Type;
export type OidcConfiguration = typeof OidcConfiguration.Type;
export interface OidcClient {
  readonly configuration: OidcConfiguration;
  readonly clientSecret: Redacted.Redacted<string>;
  readonly redirectUri: string;
}
export class OidcIdentity extends Context.Service<
  OidcIdentity,
  {
    readonly discover: (
      input: Pick<OidcConfiguration, "issuer" | "clientId" | "clientAuthenticationMethod">,
    ) => Effect.Effect<OidcConfiguration, IdentityError>;
    readonly authorizationUrl: (
      input: OidcClient & {
        readonly state: Redacted.Redacted<string>;
        readonly nonce: Redacted.Redacted<string>;
        readonly codeChallenge: string;
        readonly reauthenticate: boolean;
      },
    ) => Effect.Effect<string, IdentityError>;
    readonly exchangeAndVerify: (
      input: OidcClient & {
        readonly code: Redacted.Redacted<string>;
        readonly state: Redacted.Redacted<string>;
        readonly nonce: Redacted.Redacted<string>;
        readonly verifier: Redacted.Redacted<string>;
        readonly reauthenticate: boolean;
      },
    ) => Effect.Effect<OidcIdentityClaims, IdentityError>;
  }
>()("@usepreface/application/auth/OidcIdentity") {}
