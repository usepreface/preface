import type { RolePermission } from "@usepreface/protocol";

export type Role = {
  /** Shaped like the UUIDv7 ids the API returns, so forms can validate them with the protocol schemas. */
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly scope: "organization" | "team";
  readonly kind: "builtin" | "custom";
  readonly description: string;
  readonly permissions: readonly RolePermission[];
  readonly members: readonly string[];
};

export const roles: readonly Role[] = [
  {
    id: "0192f0c8-6b1a-7c3e-8a41-1f0d2c7e9a01",
    name: "Owner",
    key: "owner",
    scope: "organization",
    kind: "builtin",
    description: "Full control, including archiving the organization.",
    permissions: [
      "organization.read",
      "organization.update",
      "organization.archive",
      "members.read",
      "members.manage",
      "teams.read",
      "teams.manage",
      "roles.read",
      "roles.manage",
      "roles.assign",
      "audit.read",
    ],
    members: ["Aisha Khan"],
  },
  {
    id: "0192f0c8-6b1a-7c3e-8a41-1f0d2c7e9a02",
    name: "Admin",
    key: "admin",
    scope: "organization",
    kind: "builtin",
    description: "Manage members, teams and sign-in rules.",
    permissions: [
      "organization.read",
      "organization.update",
      "members.read",
      "members.manage",
      "teams.read",
      "teams.manage",
      "roles.read",
      "roles.assign",
      "audit.read",
    ],
    members: ["Jon Smith", "Sara Lind"],
  },
  {
    id: "0192f0c8-6b1a-7c3e-8a41-1f0d2c7e9a03",
    name: "Member",
    key: "member",
    scope: "organization",
    kind: "builtin",
    description: "Ask, search and use channels.",
    permissions: ["organization.read", "members.read", "teams.read"],
    members: ["Marco Rossi", "Lena Park", "Priya Raman", "Tomás Núñez", "Kenji Ito"],
  },
  {
    id: "0192f0c8-6b1a-7c3e-8a41-1f0d2c7e9a04",
    name: "Guest",
    key: "guest",
    scope: "organization",
    kind: "builtin",
    description: "Read-only access to shared collections.",
    permissions: ["organization.read"],
    members: ["Owen Brooks"],
  },
  {
    id: "0192f0c8-6b1a-7c3e-8a41-1f0d2c7e9a05",
    name: "Support lead",
    key: "support-lead",
    scope: "organization",
    kind: "custom",
    description:
      "Handles escalations: can invite members, manage the Support team and read activity.",
    permissions: [
      "organization.read",
      "members.read",
      "members.manage",
      "teams.read",
      "teams.manage",
      "audit.read",
    ],
    members: ["Marco Rossi", "Tomás Núñez", "Priya Raman"],
  },
  {
    id: "0192f0c8-6b1a-7c3e-8a41-1f0d2c7e9a06",
    name: "Team lead",
    key: "team-lead",
    scope: "team",
    kind: "builtin",
    description: "Manages the team’s members and settings.",
    permissions: [
      "team.read",
      "team.update",
      "team.archive",
      "team.members.read",
      "team.members.manage",
      "team.roles.read",
      "team.roles.assign",
    ],
    members: ["Marco Rossi", "Aisha Khan", "Jon Smith"],
  },
  {
    id: "0192f0c8-6b1a-7c3e-8a41-1f0d2c7e9a07",
    name: "Team member",
    key: "team-member",
    scope: "team",
    kind: "builtin",
    description: "Uses everything shared with the team.",
    permissions: ["team.read", "team.members.read", "team.roles.read"],
    members: ["Tomás Núñez", "Priya Raman", "Lena Park"],
  },
  {
    id: "0192f0c8-6b1a-7c3e-8a41-1f0d2c7e9a08",
    name: "Docs editor",
    key: "docs-editor",
    scope: "team",
    kind: "custom",
    description: "Edits the team’s collections and invites reviewers.",
    permissions: [
      "team.read",
      "team.update",
      "team.members.read",
      "team.members.manage",
      "team.roles.read",
    ],
    members: ["Priya Raman"],
  },
];

export const teamOptions = [
  { id: "0192f0c8-7d22-7a10-9b3e-5c2f1a7d0b01", name: "Platform" },
  { id: "0192f0c8-7d22-7a10-9b3e-5c2f1a7d0b02", name: "Support" },
  { id: "0192f0c8-7d22-7a10-9b3e-5c2f1a7d0b03", name: "Docs" },
  { id: "0192f0c8-7d22-7a10-9b3e-5c2f1a7d0b04", name: "Sales" },
  { id: "0192f0c8-7d22-7a10-9b3e-5c2f1a7d0b05", name: "Security" },
] as const;
