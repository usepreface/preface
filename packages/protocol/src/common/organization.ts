import { Schema } from "effect";

export { DisplayName as OrganizationName } from "#/common/display-name";
export const TeamSlug = Schema.String.check(
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
  "audit.read",
  "teams.read",
  "teams.manage",
  "organization.read",
  "organization.update",
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
export const OrganizationLoginMethod = Schema.Literals([
  "email_code",
  "email_link",
  "google",
  "oidc",
  "saml",
]);
export type OrganizationLoginMethod = typeof OrganizationLoginMethod.Type;

export const TeamPermission = Schema.Literals([
  "team.read",
  "team.update",
  "team.archive",
  "team.members.read",
  "team.members.manage",
  "team.roles.read",
  "team.roles.assign",
]);
export type TeamPermission = typeof TeamPermission.Type;
export const RoleScope = Schema.Literals(["organization", "team"]);
export type RoleScope = typeof RoleScope.Type;
export const RolePermission = Schema.Union([OrganizationPermission, TeamPermission]);
export type RolePermission = typeof RolePermission.Type;
export const RolePermissions = Schema.Array(RolePermission).check(Schema.isUnique());
