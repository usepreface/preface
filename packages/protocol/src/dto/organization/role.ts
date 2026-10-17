import { Schema } from "effect";

import {
  OrganizationName,
  OrganizationRoleKey,
  OrganizationRoleKind,
  OrganizationPermissions,
} from "#/common/organization";
import {
  OrganizationMemberId,
  OrganizationRoleId,
  OrganizationRoleBindingId,
} from "#/identifiers/organization";

export const PublicOrganizationRole = Schema.Struct({
  id: OrganizationRoleId,
  key: OrganizationRoleKey,
  name: OrganizationName,
  kind: OrganizationRoleKind,
  permissions: OrganizationPermissions,
  archivedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  createdAt: Schema.DateTimeUtcFromString,
  updatedAt: Schema.DateTimeUtcFromString,
});
export type PublicOrganizationRole = typeof PublicOrganizationRole.Type;
export const CreateOrganizationRoleRequest = Schema.Struct({
  key: Schema.String,
  name: Schema.String,
  permissions: OrganizationPermissions,
});
export const UpdateOrganizationRoleRequest = Schema.Struct({
  name: Schema.optionalKey(Schema.String),
  permissions: Schema.optionalKey(OrganizationPermissions),
});
export const ListOrganizationRolesQuery = Schema.Struct({
  cursor: Schema.optionalKey(OrganizationRoleId),
  limit: Schema.optionalKey(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 }))),
  includeArchived: Schema.optionalKey(Schema.Boolean),
});
export type ListOrganizationRolesQuery = typeof ListOrganizationRolesQuery.Type;
export const OrganizationRoleList = Schema.Struct({
  roles: Schema.Array(PublicOrganizationRole),
  nextCursor: Schema.NullOr(OrganizationRoleId),
});
export const GrantOrganizationRoleRequest = Schema.Struct({
  memberId: OrganizationMemberId,
  roleId: OrganizationRoleId,
});
export const PublicOrganizationRoleBinding = Schema.Struct({
  id: OrganizationRoleBindingId,
  roleId: OrganizationRoleId,
  memberId: OrganizationMemberId,
  grantedByMemberId: OrganizationMemberId,
  createdAt: Schema.DateTimeUtcFromString,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export type PublicOrganizationRoleBinding = typeof PublicOrganizationRoleBinding.Type;
