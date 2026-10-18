export type MemberStatus = "active" | "suspended" | "removed";

export type Member = {
  readonly name: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly teams: readonly string[];
  readonly status: MemberStatus;
  readonly lastActive: string;
};

export const members: readonly Member[] = [
  {
    name: "Aisha Khan",
    email: "aisha@acme.dev",
    roles: ["Owner"],
    teams: ["Support", "Docs"],
    status: "active",
    lastActive: "Now",
  },
  {
    name: "Marco Rossi",
    email: "marco@acme.dev",
    roles: ["Member", "Support lead"],
    teams: ["Support"],
    status: "active",
    lastActive: "5m ago",
  },
  {
    name: "Jon Smith",
    email: "jon@acme.dev",
    roles: ["Admin"],
    teams: ["Platform"],
    status: "active",
    lastActive: "1h ago",
  },
  {
    name: "Lena Park",
    email: "lena@acme.dev",
    roles: ["Member"],
    teams: ["Sales"],
    status: "active",
    lastActive: "Yesterday",
  },
  {
    name: "Priya Raman",
    email: "priya@acme.dev",
    roles: ["Member"],
    teams: ["Docs"],
    status: "active",
    lastActive: "3d ago",
  },
  {
    name: "Owen Brooks",
    email: "owen@acme.dev",
    roles: ["Guest"],
    teams: [],
    status: "suspended",
    lastActive: "Oct 2",
  },
  {
    name: "Sara Lind",
    email: "sara@acme.dev",
    roles: ["Admin"],
    teams: ["Platform", "Security"],
    status: "active",
    lastActive: "20m ago",
  },
  {
    name: "Kenji Ito",
    email: "kenji@acme.dev",
    roles: ["Member"],
    teams: [],
    status: "removed",
    lastActive: "Sep 28",
  },
];

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";
export type DeliveryStatus = "pending" | "processing" | "sent" | "failed";

export type Invitation = {
  readonly email: string;
  readonly invitedBy: string;
  readonly sentOn: string;
  readonly roles: readonly string[];
  readonly teams: readonly string[];
  readonly status: InvitationStatus;
  readonly expires: string;
  readonly delivery: DeliveryStatus;
};

export const invitations: readonly Invitation[] = [
  {
    email: "tomas@acme.dev",
    invitedBy: "Aisha Khan",
    sentOn: "Oct 17",
    roles: ["Member"],
    teams: ["Support"],
    status: "pending",
    expires: "In 6 days",
    delivery: "sent",
  },
  {
    email: "nina@acme.dev",
    invitedBy: "Jon Smith",
    sentOn: "Oct 16",
    roles: ["Admin"],
    teams: [],
    status: "pending",
    expires: "In 5 days",
    delivery: "failed",
  },
  {
    email: "dev@contractor.io",
    invitedBy: "Sara Lind",
    sentOn: "Oct 15",
    roles: ["Guest"],
    teams: ["Docs"],
    status: "pending",
    expires: "In 4 days",
    delivery: "processing",
  },
  {
    email: "marco@acme.dev",
    invitedBy: "Aisha Khan",
    sentOn: "Oct 10",
    roles: ["Member"],
    teams: ["Support"],
    status: "accepted",
    expires: "Joined Oct 11",
    delivery: "sent",
  },
  {
    email: "owen.b@gmail.com",
    invitedBy: "Jon Smith",
    sentOn: "Oct 1",
    roles: ["Guest"],
    teams: [],
    status: "expired",
    expires: "Oct 8",
    delivery: "sent",
  },
  {
    email: "kenji.ito@acme.dev",
    invitedBy: "Sara Lind",
    sentOn: "Sep 30",
    roles: ["Member"],
    teams: [],
    status: "revoked",
    expires: "—",
    delivery: "sent",
  },
];

export type Team = {
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly members: readonly string[];
  readonly archived?: boolean;
};

export const teams: readonly Team[] = [
  {
    name: "Platform",
    slug: "platform",
    description: "Infrastructure, deploys and on-call.",
    members: ["Jon Smith", "Sara Lind", "Aisha Khan"],
  },
  {
    name: "Support",
    slug: "support",
    description: "Customer escalations and the help center.",
    members: [
      "Marco Rossi",
      "Aisha Khan",
      "Tomás Núñez",
      "Priya Raman",
      "Lena Park",
      "Owen Brooks",
    ],
  },
  {
    name: "Docs",
    slug: "docs",
    description: "Product docs, guides and the changelog.",
    members: ["Priya Raman", "Aisha Khan"],
  },
  {
    name: "Sales",
    slug: "sales",
    description: "Enablement decks and pricing answers.",
    members: ["Lena Park", "Owen Brooks"],
  },
  {
    name: "Security",
    slug: "security",
    description: "Policies, audits and access reviews.",
    members: ["Sara Lind"],
  },
  {
    name: "Design",
    slug: "design",
    description: "Retired when design moved under Product.",
    members: [],
    archived: true,
  },
];

export const teamMembers = [
  {
    name: "Marco Rossi",
    email: "marco@acme.dev",
    teamRole: "Team lead",
    orgRole: "Member",
    added: "Oct 11",
  },
  {
    name: "Aisha Khan",
    email: "aisha@acme.dev",
    teamRole: "Team lead",
    orgRole: "Owner",
    added: "Oct 18",
  },
  {
    name: "Tomás Núñez",
    email: "tomas@acme.dev",
    teamRole: "Team member",
    orgRole: "Member",
    added: "Oct 12",
  },
  {
    name: "Priya Raman",
    email: "priya@acme.dev",
    teamRole: "Team member",
    orgRole: "Member",
    added: "Oct 13",
  },
  {
    name: "Lena Park",
    email: "lena@acme.dev",
    teamRole: "Team member",
    orgRole: "Member",
    added: "Oct 14",
  },
  {
    name: "Owen Brooks",
    email: "owen@acme.dev",
    teamRole: "Team member",
    orgRole: "Guest",
    added: "Oct 2",
  },
] as const;
