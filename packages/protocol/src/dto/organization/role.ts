import { Schema } from "effect";

import {
  OrganizationName,
  OrganizationRoleKey,
  OrganizationRoleKind,
  RolePermissions,
  RoleScope,
} from "#/common/organization";
import { PageSize } from "#/common/pagination";
import {
  TeamId,
  OrganizationMemberId,
  OrganizationRoleId,
  OrganizationRoleBindingId,
} from "#/identifiers/organization";

export const PublicOrganizationRole = Schema.Struct({
  id: OrganizationRoleId,
  key: OrganizationRoleKey,
  name: OrganizationName,
  kind: OrganizationRoleKind,
  scopeKind: RoleScope,
  permissions: RolePermissions,
  archivedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  createdAt: Schema.DateTimeUtcFromString,
  updatedAt: Schema.DateTimeUtcFromString,
});
export type PublicOrganizationRole = typeof PublicOrganizationRole.Type;

export const CreateOrganizationRoleRequest = Schema.Struct({
  scopeKind: Schema.optionalKey(RoleScope),
  key: Schema.String,
  name: Schema.String,
  permissions: RolePermissions,
});

export const UpdateOrganizationRoleRequest = Schema.Struct({
  name: Schema.optionalKey(Schema.String),
  permissions: Schema.optionalKey(RolePermissions),
});

export const ListOrganizationRolesQuery = Schema.Struct({
  scopeKind: Schema.optionalKey(RoleScope),
  cursor: Schema.optionalKey(OrganizationRoleId),
  limit: Schema.optionalKey(PageSize),
  includeArchived: Schema.optionalKey(Schema.Boolean),
});
export type ListOrganizationRolesQuery = typeof ListOrganizationRolesQuery.Type;

export const OrganizationRoleList = Schema.Struct({
  roles: Schema.Array(PublicOrganizationRole),
  nextCursor: Schema.NullOr(OrganizationRoleId),
});

export const GrantOrganizationRoleRequest = Schema.Struct({
  teamId: Schema.optionalKey(TeamId),
  memberId: OrganizationMemberId,
  roleId: OrganizationRoleId,
});

export const PublicOrganizationRoleBinding = Schema.Struct({
  scopeKind: RoleScope,
  teamId: Schema.NullOr(TeamId),
  id: OrganizationRoleBindingId,
  roleId: OrganizationRoleId,
  memberId: OrganizationMemberId,
  grantedByMemberId: OrganizationMemberId,
  createdAt: Schema.DateTimeUtcFromString,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export type PublicOrganizationRoleBinding = typeof PublicOrganizationRoleBinding.Type;
