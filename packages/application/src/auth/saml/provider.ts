import { Context, Schema, type Effect, type Redacted, type DateTime } from "effect";

import type { IdentityError } from "@usepreface/protocol";
import type { SamlConfiguration } from "@usepreface/protocol/model";

export const SamlIdentityClaims = Schema.Struct({
  issuer: Schema.NonEmptyString,
  subject: Schema.NonEmptyString,
  email: Schema.optionalKey(Schema.NullOr(Schema.String)),
  authenticatedAt: Schema.DateTimeUtcFromDate,
  validUntil: Schema.DateTimeUtcFromDate,
  sessionExpiresAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  responseId: Schema.NonEmptyString,
  assertionId: Schema.NonEmptyString,
});
export type SamlIdentityClaims = typeof SamlIdentityClaims.Type;
export interface SamlClient {
  readonly configuration: SamlConfiguration;
  readonly additionalSigningCertificates?: readonly string[];
  readonly privateKey: Redacted.Redacted<string>;
}
export class SamlIdentity extends Context.Service<
  SamlIdentity,
  {
    readonly validateConfiguration: (
      idp: NonNullable<SamlConfiguration["idp"]>,
    ) => Effect.Effect<NonNullable<SamlConfiguration["idp"]>, IdentityError>;
    readonly metadata: (client: SamlClient) => Effect.Effect<string, IdentityError>;
    readonly authorizationUrl: (
      input: SamlClient & {
        readonly requestId: string;
        readonly relayState: Redacted.Redacted<string>;
        readonly forceAuthentication: boolean;
      },
    ) => Effect.Effect<string, IdentityError>;
    readonly validateResponse: (
      input: SamlClient & {
        readonly requestId: string;
        readonly requestedAt: DateTime.Utc;
        readonly response: Redacted.Redacted<string>;
      },
    ) => Effect.Effect<SamlIdentityClaims, IdentityError>;
  }
>()("@usepreface/application/auth/SamlIdentity") {}
