import { Schema } from "effect";

import {
  OrganizationName,
  OrganizationRoleKey,
  OrganizationRoleKind,
  OrganizationPermissions,
} from "#/common/organization";
import { OrganizationId, OrganizationRoleId } from "#/identifiers/organization";

export const CreateOrganizationRole = Schema.Struct({
  organizationId: OrganizationId,
  key: OrganizationRoleKey,
  name: OrganizationName,
  kind: OrganizationRoleKind,
  permissions: OrganizationPermissions,
});
export type CreateOrganizationRole = typeof CreateOrganizationRole.Type;
export const OrganizationRole = Schema.Struct({
  id: OrganizationRoleId,
  ...CreateOrganizationRole.fields,
  archivedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type OrganizationRole = typeof OrganizationRole.Type;

export const UpdateOrganizationRole = Schema.Struct({
  name: OrganizationName,
  permissions: OrganizationPermissions,
});
export type UpdateOrganizationRole = typeof UpdateOrganizationRole.Type;
