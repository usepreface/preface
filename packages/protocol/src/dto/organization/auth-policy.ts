import { Schema } from "effect";

import { OrganizationLoginMethod } from "#/common/organization";

export const PublicOrganizationAuthPolicy = Schema.Struct({
  revision: Schema.Int.check(Schema.isGreaterThan(0)),
  allowedMethods: Schema.Array(OrganizationLoginMethod),
  updatedAt: Schema.DateTimeUtcFromString,
});
export type PublicOrganizationAuthPolicy = typeof PublicOrganizationAuthPolicy.Type;
