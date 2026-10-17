import { Schema } from "effect";

import { IdentityRevision } from "#/common/identity";
import { OidcClientAuthentication, OidcClientId, OidcIssuer } from "#/common/oidc";

const name = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(120),
  Schema.isTrimmed(),
);
const secret = Schema.RedactedFromValue(
  Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4096)),
  { disallowEncode: true },
);
export const CreateOidcConnectionInput = Schema.Struct({
  name,
  issuer: OidcIssuer,
  clientId: OidcClientId,
  clientSecret: secret,
  clientAuthenticationMethod: OidcClientAuthentication,
});
export type CreateOidcConnectionInput = typeof CreateOidcConnectionInput.Type;
export const UpdateOidcConnectionInput = Schema.Struct({
  expectedRevision: IdentityRevision,
  name: Schema.optionalKey(name),
  issuer: Schema.optionalKey(OidcIssuer),
  clientId: Schema.optionalKey(OidcClientId),
  clientSecret: Schema.optionalKey(secret),
  clientAuthenticationMethod: Schema.optionalKey(OidcClientAuthentication),
});
export type UpdateOidcConnectionInput = typeof UpdateOidcConnectionInput.Type;
