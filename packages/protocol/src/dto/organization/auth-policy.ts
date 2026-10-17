import { Schema } from "effect";

import { OrganizationLoginMethod } from "#/common/organization";
import { IdentityConnectionId } from "#/identifiers/identity";

export const PublicOrganizationAuthPolicy = Schema.Struct({
  revision: Schema.Int.check(Schema.isGreaterThan(0)),
  allowedMethods: Schema.Array(OrganizationLoginMethod),
  oidcConnectionIds: Schema.optionalKey(Schema.Array(IdentityConnectionId)),
  updatedAt: Schema.DateTimeUtcFromString,
});
export type PublicOrganizationAuthPolicy = typeof PublicOrganizationAuthPolicy.Type;
