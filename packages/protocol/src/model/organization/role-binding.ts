import { Schema } from "effect";

import {
  OrganizationId,
  OrganizationMemberId,
  OrganizationRoleId,
  OrganizationRoleBindingId,
} from "#/identifiers/organization";

export const GrantOrganizationRole = Schema.Struct({
  organizationId: OrganizationId,
  roleId: OrganizationRoleId,
  memberId: OrganizationMemberId,
  grantedByMemberId: OrganizationMemberId,
});
export type GrantOrganizationRole = typeof GrantOrganizationRole.Type;
export const OrganizationRoleBinding = Schema.Struct({
  id: OrganizationRoleBindingId,
  ...GrantOrganizationRole.fields,
  createdAt: Schema.DateTimeUtcFromDate,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type OrganizationRoleBinding = typeof OrganizationRoleBinding.Type;
