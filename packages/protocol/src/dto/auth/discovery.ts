import { Schema } from "effect";

import { OrganizationAuthenticationMethods } from "#/dto/auth/identity";
import { IdentityConnectionId } from "#/identifiers/identity";
export const AuthenticationDiscovery = Schema.Struct({
  email: Schema.Boolean,
  google: Schema.Boolean,
  connections: Schema.Array(
    Schema.Struct({
      connectionId: IdentityConnectionId,
      provider: Schema.Literals(["oidc", "saml"]),
      name: Schema.String,
    }),
  ),
});
export const CurrentOrganizationAuthentication = Schema.Struct({
  authentication: OrganizationAuthenticationMethods,
});
