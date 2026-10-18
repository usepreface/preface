import type { OrganizationPermission, TeamPermission } from "@usepreface/protocol";

/*
 * Labels and grouping for the permissions defined in the protocol. The protocol owns the list; this
 * module only decides how the role form presents it.
 */
export type PermissionGroup<P extends string> = {
  readonly title: string;
  readonly permissions: readonly { readonly id: P; readonly label: string }[];
};

export const organizationPermissionGroups: readonly PermissionGroup<OrganizationPermission>[] = [
  {
    title: "Organization",
    permissions: [
      { id: "organization.read", label: "View organization" },
      { id: "organization.update", label: "Edit details" },
      { id: "organization.archive", label: "Archive and restore" },
    ],
  },
  {
    title: "Members",
    permissions: [
      { id: "members.read", label: "View members" },
      { id: "members.manage", label: "Invite, suspend and remove" },
    ],
  },
  {
    title: "Teams",
    permissions: [
      { id: "teams.read", label: "View teams" },
      { id: "teams.manage", label: "Create and manage teams" },
    ],
  },
  {
    title: "Roles",
    permissions: [
      { id: "roles.read", label: "View roles" },
      { id: "roles.manage", label: "Create and edit roles" },
      { id: "roles.assign", label: "Assign roles" },
    ],
  },
  { title: "Security", permissions: [{ id: "audit.read", label: "View activity history" }] },
];

export const teamPermissionGroups: readonly PermissionGroup<TeamPermission>[] = [
  {
    title: "Team",
    permissions: [
      { id: "team.read", label: "View team" },
      { id: "team.update", label: "Edit details" },
      { id: "team.archive", label: "Archive team" },
    ],
  },
  {
    title: "Members",
    permissions: [
      { id: "team.members.read", label: "View members" },
      { id: "team.members.manage", label: "Add and remove members" },
    ],
  },
  {
    title: "Roles",
    permissions: [
      { id: "team.roles.read", label: "View team roles" },
      { id: "team.roles.assign", label: "Assign team roles" },
    ],
  },
];

/** The groups a role of this scope can grant. */
export function permissionGroupsFor(
  scope: "organization" | "team",
): readonly PermissionGroup<string>[] {
  return scope === "team" ? teamPermissionGroups : organizationPermissionGroups;
}
