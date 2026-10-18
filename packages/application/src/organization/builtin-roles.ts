import type { OrganizationPermission } from "@usepreface/protocol";

export const builtinOrganizationRoles = [
  {
    key: "owner",
    name: "Owner",
    permissions: [
      "audit.read",
      "teams.read",
      "teams.manage",
      "organization.read",
      "organization.update",
      "organization.archive",
      "members.read",
      "members.manage",
      "roles.read",
      "roles.manage",
      "roles.assign",
    ],
  },
  {
    key: "admin",
    name: "Administrator",
    permissions: [
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
    ],
  },
  {
    key: "member",
    name: "Member",
    permissions: ["organization.read", "members.read", "roles.read", "teams.read"],
  },
] as const satisfies readonly {
  readonly key: string;
  readonly name: string;
  readonly permissions: readonly OrganizationPermission[];
}[];

export const builtinTeamRoles = [
  {
    key: "admin",
    name: "Team administrator",
    permissions: [
      "team.read",
      "team.update",
      "team.archive",
      "team.members.read",
      "team.members.manage",
      "team.roles.read",
      "team.roles.assign",
    ],
  },
  {
    key: "member",
    name: "Team member",
    permissions: ["team.read", "team.members.read", "team.roles.read"],
  },
] as const;
