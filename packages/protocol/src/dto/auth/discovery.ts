import { Schema } from "effect";

import { OrganizationSlug } from "#/common/organization";
import { OrganizationAuthenticationMethods } from "#/dto/auth/identity";
import { IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationId } from "#/identifiers/organization";

export const AuthenticationDiscoveryRequest = Schema.Struct({
  email: Schema.String,
  organizationSlug: Schema.optionalKey(OrganizationSlug),
});
export const AuthenticationDiscovery = Schema.Struct({
  email: Schema.Boolean,
  google: Schema.Boolean,
  requiresOrganizationSelection: Schema.Boolean,
  connections: Schema.Array(
    Schema.Struct({
      organizationId: OrganizationId,
      connectionId: IdentityConnectionId,
      provider: Schema.Literals(["oidc", "saml"]),
      name: Schema.String,
    }),
  ),
});
export const OrganizationSelection = Schema.Struct({
  organizationId: OrganizationId,
  authentication: OrganizationAuthenticationMethods,
});
