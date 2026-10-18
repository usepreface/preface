import { roles, type Role } from "#/lib/placeholder";

/** Role lookups for the placeholder data, by the names members and invitations carry. */
export const organizationRoles = roles.filter((role) => role.scope === "organization");
export const teamRoles = roles.filter((role) => role.scope === "team");

const byName = new Map(roles.map((role) => [role.name, role]));

export function roleByName(name: string): Role | undefined {
  return byName.get(name);
}

export function roleIds(names: readonly string[]): string[] {
  return names.flatMap((name) => byName.get(name)?.id ?? []);
}

export function isCustomRole(name: string): boolean {
  return byName.get(name)?.kind === "custom";
}
