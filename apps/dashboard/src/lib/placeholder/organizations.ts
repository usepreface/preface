export type OrganizationAccess = "open" | "sso" | "archived";

export type OrganizationSummary = {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly access: OrganizationAccess;
  readonly role: string;
  readonly members: number;
  readonly provider?: "okta" | "microsoft";
  readonly note?: string;
};

export const organizations: readonly OrganizationSummary[] = [
  {
    name: "Acme",
    slug: "acme",
    description: "Answers for Acme engineering, support and sales.",
    access: "open",
    role: "Owner",
    members: 18,
    note: "Last opened 2 hours ago",
  },
  {
    name: "Globex Research",
    slug: "globex",
    description: "Lab protocols, research notes and shared datasets.",
    access: "sso",
    role: "Member",
    members: 42,
    provider: "okta",
  },
  {
    name: "Initech Support",
    slug: "initech",
    description: "Support macros and the public help center.",
    access: "open",
    role: "Admin",
    members: 9,
  },
  {
    name: "Umbrella Labs",
    slug: "umbrella",
    description: "Archived pilot workspace. Read-only.",
    access: "archived",
    role: "Member",
    members: 6,
    note: "Archived Sep 30",
  },
];

export const pendingInvitation = {
  organization: "Hooli Docs",
  invitedBy: "Gavin Belson",
  role: "Member",
  expires: "in 5 days",
} as const;

/** The invitation shown on /invitations/accept. */
export const invitation = {
  organization: {
    name: "Acme",
    slug: "acme",
    description: "Answers for Acme engineering, support and sales.",
  },
  invitedBy: { name: "Aisha Khan", email: "aisha@acme.dev" },
  email: "marco@acme.dev",
  roles: ["Member", "Support lead"],
  teams: [
    { name: "Support", role: "Team lead" },
    { name: "Docs", role: "Team member" },
  ],
  stats: { members: 18, sources: 12, teams: 5 },
  expires: "in 6 days",
  sentOn: "Oct 4",
} as const;

/** Organizations listed on the instance overview. */
export const instanceOrganizations = [
  {
    name: "Acme",
    slug: "acme",
    owner: "Aisha Khan",
    members: 18,
    status: "active",
    created: "Oct 18, 2026",
  },
  {
    name: "Globex Research",
    slug: "globex",
    owner: "Hank Scorpio",
    members: 42,
    status: "active",
    created: "Aug 3, 2026",
  },
  {
    name: "Initech Support",
    slug: "initech",
    owner: "Bill Lumbergh",
    members: 9,
    status: "active",
    created: "Jul 21, 2026",
  },
  {
    name: "Acme Labs",
    slug: "acme-labs",
    owner: "Aisha Khan",
    members: 1,
    status: "active",
    created: "Oct 17, 2026",
  },
  {
    name: "Umbrella Labs",
    slug: "umbrella",
    owner: "Albert Wesker",
    members: 6,
    status: "archived",
    created: "Mar 2, 2026",
  },
] as const;

/** The organization for a URL slug. Unknown slugs get a name made from the slug. */
export function organizationBySlug(slug: string): OrganizationSummary {
  return (
    organizations.find((organization) => organization.slug === slug) ?? {
      name: slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll("-", " "),
      slug,
      description: "",
      access: "open",
      role: "Owner",
      members: 1,
    }
  );
}
