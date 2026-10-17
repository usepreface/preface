import { Schema } from "effect";

import { IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationId, OrganizationMemberId } from "#/identifiers/organization";

export const OrganizationAuthPolicyConnection = Schema.Struct({
  organizationId: OrganizationId,
  identityConnectionId: IdentityConnectionId,
  createdByMemberId: OrganizationMemberId,
  createdAt: Schema.DateTimeUtcFromDate,
});
export type OrganizationAuthPolicyConnection = typeof OrganizationAuthPolicyConnection.Type;
