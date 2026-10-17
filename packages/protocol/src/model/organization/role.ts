import { Schema } from "effect";

import {
  OrganizationName,
  OrganizationRoleKey,
  OrganizationRoleKind,
  RolePermissions,
  RoleScope,
  OrganizationPermission,
  TeamPermission,
} from "#/common/organization";
import { OrganizationId, OrganizationRoleId } from "#/identifiers/organization";

export const CreateOrganizationRole = Schema.Struct({
  organizationId: OrganizationId,
  key: OrganizationRoleKey,
  name: OrganizationName,
  kind: OrganizationRoleKind,
  scopeKind: Schema.optionalKey(RoleScope),
  permissions: RolePermissions,
});
export type CreateOrganizationRole = typeof CreateOrganizationRole.Type;
export const OrganizationRole = Schema.Struct({
  id: OrganizationRoleId,
  ...CreateOrganizationRole.fields,
  scopeKind: RoleScope,
  archivedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
}).check(
  Schema.makeFilter(
    (role) =>
      role.permissions.every(
        Schema.is(role.scopeKind === "organization" ? OrganizationPermission : TeamPermission),
      ) || "Wrong-scope permission",
  ),
);
export type OrganizationRole = typeof OrganizationRole.Type;

export const UpdateOrganizationRole = Schema.Struct({
  name: OrganizationName,
  permissions: RolePermissions,
});
export type UpdateOrganizationRole = typeof UpdateOrganizationRole.Type;
