import { Schema } from "effect";

import { OrganizationLoginMethod } from "#/common/organization";
import { OrganizationSsoMode, SsoMaxAgeSeconds } from "#/common/organization-authentication";
import { IdentityConnectionId } from "#/identifiers/identity";

export const PublicOrganizationAuthPolicy = Schema.Struct({
  revision: Schema.Int.check(Schema.isGreaterThan(0)),
  ssoMode: OrganizationSsoMode,
  ssoMaxAgeSeconds: SsoMaxAgeSeconds,
  allowedMethods: Schema.Array(OrganizationLoginMethod),
  oidcConnectionIds: Schema.optionalKey(Schema.Array(IdentityConnectionId)),
  updatedAt: Schema.DateTimeUtcFromString,
});
export type PublicOrganizationAuthPolicy = typeof PublicOrganizationAuthPolicy.Type;
