import { Schema } from "effect";

import { OrganizationLoginMethod } from "#/common/organization";
import { OrganizationId, OrganizationMemberId } from "#/identifiers/organization";

export const OrganizationAuthPolicy = Schema.Struct({
  organizationId: OrganizationId,
  revision: Schema.Int.check(Schema.isGreaterThan(0)),
  allowedMethods: Schema.Array(OrganizationLoginMethod).check(Schema.isMinLength(1)),
  updatedByMemberId: OrganizationMemberId,
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type OrganizationAuthPolicy = typeof OrganizationAuthPolicy.Type;
