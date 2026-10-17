import { Schema } from "effect";

import {
  TeamId,
  OrganizationId,
  OrganizationMemberId,
  OrganizationRoleId,
  OrganizationRoleBindingId,
} from "#/identifiers/organization";

export const GrantOrganizationRole = Schema.Struct({
  teamId: Schema.optionalKey(Schema.NullOr(TeamId)),
  organizationId: OrganizationId,
  roleId: OrganizationRoleId,
  memberId: OrganizationMemberId,
  grantedByMemberId: OrganizationMemberId,
});
export type GrantOrganizationRole = typeof GrantOrganizationRole.Type;
export const OrganizationRoleBinding = Schema.Struct({
  id: OrganizationRoleBindingId,
  ...GrantOrganizationRole.fields,
  scopeKind: Schema.Literals(["organization", "team"]),
  teamId: Schema.NullOr(TeamId),
  createdAt: Schema.DateTimeUtcFromDate,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type OrganizationRoleBinding = typeof OrganizationRoleBinding.Type;
