import type { OrganizationPermission } from "@usepreface/protocol";

export const builtinOrganizationRoles = [
  {
    key: "owner",
    name: "Owner",
    permissions: [
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
    permissions: ["organization.read", "members.read", "roles.read"],
  },
] as const satisfies readonly {
  readonly key: string;
  readonly name: string;
  readonly permissions: readonly OrganizationPermission[];
}[];
