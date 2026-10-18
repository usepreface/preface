export type ActivityEvent = {
  readonly time: string;
  readonly actor: string;
  readonly action: string;
  readonly target: string;
  readonly detail: string;
};

export const organizationActivity: readonly ActivityEvent[] = [
  {
    time: "Oct 18, 23:14",
    actor: "Aisha Khan",
    action: "sso.connection.tested",
    target: "Microsoft Entra ID",
    detail: "Passed",
  },
  {
    time: "Oct 18, 22:51",
    actor: "Aisha Khan",
    action: "policy.sso_required",
    target: "Login policy",
    detail: "Optional → Required",
  },
  {
    time: "Oct 18, 21:07",
    actor: "Jon Smith",
    action: "member.role_changed",
    target: "Marco Rossi",
    detail: "Member → Member, Support lead",
  },
  {
    time: "Oct 18, 19:40",
    actor: "Sara Lind",
    action: "member.suspended",
    target: "Owen Brooks",
    detail: "Parental leave",
  },
  {
    time: "Oct 18, 18:02",
    actor: "Aisha Khan",
    action: "invitation.sent",
    target: "tomas@acme.dev",
    detail: "Member · Support",
  },
  {
    time: "Oct 18, 16:55",
    actor: "System",
    action: "domain.verified",
    target: "contractors.acme.dev",
    detail: "TXT record found",
  },
  {
    time: "Oct 18, 15:31",
    actor: "Jon Smith",
    action: "team.created",
    target: "Security",
    detail: "2 members",
  },
  {
    time: "Oct 18, 14:12",
    actor: "Priya Raman",
    action: "session.revoked",
    target: "Firefox on Windows",
    detail: "By the member",
  },
  {
    time: "Oct 17, 11:48",
    actor: "Aisha Khan",
    action: "recovery_credential.created",
    target: "Login policy",
    detail: "First credential",
  },
];

export const instanceActivity: readonly ActivityEvent[] = [
  {
    time: "Oct 18, 22:30",
    actor: "Aisha Khan",
    action: "domain.claim_approved",
    target: "acme.dev → Acme",
    detail: "Approved",
  },
  {
    time: "Oct 18, 20:12",
    actor: "Aisha Khan",
    action: "google.connection.activated",
    target: "Installation Google",
    detail: "Tested Oct 12",
  },
  {
    time: "Oct 17, 09:44",
    actor: "Aisha Khan",
    action: "organization.created",
    target: "Acme Labs",
    detail: "acme-labs",
  },
  {
    time: "Oct 16, 17:20",
    actor: "System",
    action: "domain.claim_requested",
    target: "contractors.acme.dev → Acme",
    detail: "Awaiting approval",
  },
  {
    time: "Oct 12, 10:41",
    actor: "Aisha Khan",
    action: "google.connection.tested",
    target: "Installation Google",
    detail: "Passed",
  },
  {
    time: "Oct 4, 08:02",
    actor: "Aisha Khan",
    action: "domain.claim_withdrawn",
    target: "acmecorp.com → Umbrella Labs",
    detail: "Withdrawn",
  },
  {
    time: "Sep 30, 15:00",
    actor: "Aisha Khan",
    action: "organization.archived",
    target: "Umbrella Labs",
    detail: "Pilot ended",
  },
  {
    time: "Sep 28, 12:00",
    actor: "System",
    action: "instance.updated",
    target: "Preface v1.4.0",
    detail: "From v1.3.2",
  },
];

export const eventDetail = {
  action: "member.role_changed",
  at: "Oct 18, 2026 · 21:07:13 IST",
  actor: { name: "Jon Smith", detail: "jon@acme.dev · Admin" },
  target: { name: "Marco Rossi", detail: "marco@acme.dev" },
  organization: "Acme",
  session: "Okta · session ses_91ac…",
  ip: "103.21.244.18 · Bengaluru",
  requestId: "req_3c81f0aa",
  before: 'roles: ["member"]',
  after: 'roles: ["member", "support-lead"]',
} as const;
