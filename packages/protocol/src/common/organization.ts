import { Schema } from "effect";

export { DisplayName as OrganizationName } from "#/common/display-name";
export const OrganizationSlug = Schema.String.check(
  Schema.isMinLength(3),
  Schema.isMaxLength(63),
  Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
);
export const OrganizationRoleKey = Schema.String.check(
  Schema.isMinLength(3),
  Schema.isMaxLength(63),
  Schema.isPattern(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
);
export const OrganizationPermission = Schema.Literals([
  "organization.read",
  "organization.update",
  "organization.archive",
  "members.read",
  "members.manage",
  "roles.read",
  "roles.manage",
  "roles.assign",
]);
export type OrganizationPermission = typeof OrganizationPermission.Type;
export const OrganizationPermissions = Schema.Array(OrganizationPermission).check(
  Schema.makeFilter(
    (permissions) =>
      new Set(permissions).size === permissions.length || "Permissions must be unique",
  ),
);
export const OrganizationRoleKind = Schema.Literals(["builtin", "custom"]);
export const OrganizationLoginMethod = Schema.Literals(["email_code", "email_link"]);
export type OrganizationLoginMethod = typeof OrganizationLoginMethod.Type;
