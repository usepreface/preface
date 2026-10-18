import type { BrandName } from "@usepreface/ui/logos/registry";

export type ConnectionStatus = "draft" | "tested" | "active" | "disabled";

export type SsoConnection = {
  /** UUIDv7-shaped like the API's connection ids, so they validate in the login policy form. */
  readonly id: string;
  readonly name: string;
  readonly brand?: BrandName;
  readonly protocol: "oidc" | "saml";
  readonly status: ConnectionStatus;
  readonly health: {
    readonly label: string;
    readonly detail: string;
    readonly tone: "success" | "info" | "warning" | "neutral";
  };
  readonly domain?: string;
  readonly approved: boolean;
};

export const connections: readonly SsoConnection[] = [
  {
    id: "0192f0c8-8e31-7b42-9c15-2a6d3f8e1c01",
    name: "Okta",
    brand: "okta",
    protocol: "saml",
    status: "active",
    health: { label: "Healthy", detail: "Last sign-in 4m ago", tone: "success" },
    domain: "acme.dev",
    approved: true,
  },
  {
    id: "0192f0c8-8e31-7b42-9c15-2a6d3f8e1c02",
    name: "Microsoft Entra ID",
    brand: "microsoft",
    protocol: "oidc",
    status: "tested",
    health: { label: "Passed", detail: "Tested Oct 17", tone: "info" },
    domain: "contractors.acme.dev",
    approved: false,
  },
  {
    id: "0192f0c8-8e31-7b42-9c15-2a6d3f8e1c03",
    name: "Contractors Auth0",
    brand: "auth0",
    protocol: "oidc",
    status: "draft",
    health: { label: "Not tested", detail: "Finish configuration", tone: "neutral" },
    approved: false,
  },
  {
    id: "0192f0c8-8e31-7b42-9c15-2a6d3f8e1c04",
    name: "Legacy ADFS",
    protocol: "saml",
    status: "disabled",
    health: { label: "Expired", detail: "Certificate expired Sep 30", tone: "warning" },
    approved: false,
  },
];

export type DomainStatus = "verified" | "pending" | "expired";
export type DomainApproval = "approved" | "awaiting" | "none";

export const domains = [
  {
    name: "acme.dev",
    status: "verified",
    verified: "Oct 2, 2026 · renews Oct 2027",
    connection: { name: "Okta", brand: "okta" },
    approval: "approved",
  },
  {
    name: "contractors.acme.dev",
    status: "verified",
    verified: "Oct 16, 2026 · renews Oct 2027",
    connection: { name: "Entra ID", brand: "microsoft" },
    approval: "awaiting",
  },
  {
    name: "acme.io",
    status: "pending",
    verified: "Checking DNS · expires Oct 25",
    approval: "none",
  },
  {
    name: "acmecorp.com",
    status: "expired",
    verified: "TXT record removed Sep 12",
    approval: "none",
  },
] as const satisfies readonly {
  name: string;
  status: DomainStatus;
  verified: string;
  connection?: { name: string; brand: BrandName };
  approval: DomainApproval;
}[];

export const domainChallenge = {
  domain: "acme.io",
  type: "TXT",
  name: "_preface-challenge.acme.io",
  value: "preface-verify=7f3c9a2e41b8d6055e1c",
  lastCheck: "Checked 2 minutes ago · next automatic check in 8 minutes",
} as const;

export const recoveryCredential = "pf_rec_7Q2X-9KDM-4HTA-W8LZ-3NVP-6CRE";

export const connectedAccounts = [
  {
    provider: "Google",
    brand: "google",
    account: "aisha@acme.dev",
    organization: "All organizations",
    status: "connected",
    connected: "Oct 2, 2026",
    required: false,
  },
  {
    provider: "Okta · SAML",
    brand: "okta",
    account: "aisha@acme.dev",
    organization: "Acme",
    status: "connected",
    connected: "Oct 4, 2026",
    required: true,
  },
  {
    provider: "Microsoft Entra ID",
    brand: "microsoft",
    account: "Not linked yet",
    organization: "Initech Support",
    status: "not_connected",
    connected: "—",
    required: false,
  },
] as const satisfies readonly {
  provider: string;
  brand: BrandName;
  account: string;
  organization: string;
  status: "connected" | "not_connected";
  connected: string;
  required: boolean;
}[];

export const sessions = [
  {
    device: "Chrome on macOS",
    detail: "Bengaluru · Okta",
    created: "Oct 18",
    lastActive: "Now",
    expires: "Oct 19, 09:12",
    current: true,
    kind: "browser",
  },
  {
    device: "Safari on iPhone",
    detail: "Mumbai · email code",
    created: "Oct 16",
    lastActive: "3h ago",
    expires: "Oct 23",
    current: false,
    kind: "browser",
  },
  {
    device: "Preface CLI",
    detail: "Linux · device code",
    created: "Oct 10",
    lastActive: "Yesterday",
    expires: "Nov 9",
    current: false,
    kind: "terminal",
  },
  {
    device: "Firefox on Windows",
    detail: "Pune · Google",
    created: "Oct 3",
    lastActive: "9 days ago",
    expires: "Oct 24",
    current: false,
    kind: "browser",
  },
] as const;

export const googleConnection = {
  name: "Google",
  clientId: "584102937714-7r2kq0fh3l9.apps.googleusercontent.com",
  secretHint: "GOCSPX-••••••••••••••••••Xm2",
  lastTest: "Passed · Oct 12, 10:41",
  testedBy: "Aisha Khan",
  usedBy: "Acme, Initech Support",
  weeklySignIns: 214,
} as const;

/** What a connection's page shows beyond the list row. */
export const connectionDetails = {
  createdBy: {
    oidc: "For contractors on contractors.acme.dev · created Oct 16 by Jon Smith",
    saml: "acme.dev · created Oct 4 by Aisha Khan · 31 sign-ins this week",
  },
  oidc: {
    issuer: "https://login.microsoftonline.com/7f3c9a2e-41b8-4d60-9c55-1e2a90b44b7d/v2.0",
    clientId: "5c1e2a90-44b7-4d6c-9f1a-08e7c2d3b1af",
    secretHint: "••••••••••••••••••Kq8",
    clientAuthenticationMethod: "client_secret_post",
    callbackPath: "/auth/oidc/callback/conn_entra_4f2a",
    lastTest: { when: "Oct 17, 14:02", by: "Jon Smith", account: "jon@contractors.acme.dev" },
  },
  saml: {
    entityId: "http://www.okta.com/exk8w2acme7Qd5h7",
    signOnUrl: "https://acme.okta.com/app/acme_preface/exk8w2acme7Qd5h7/sso/saml",
    nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
    certificates: [
      {
        name: "okta-2025.pem",
        fingerprint: "SHA-256 4F:9A:21:…:C7:0B",
        expires: "Expires Oct 30",
        expiring: true,
        pem: "-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAYv3…\n-----END CERTIFICATE-----",
      },
    ],
    sp: {
      entityPath: "/saml/acme",
      acsPath: "/auth/saml/acs/conn_okta",
      metadataPath: "/saml/acme/metadata.xml",
    },
  },
} as const;

export function connectionById(id: string): SsoConnection | undefined {
  return connections.find((connection) => connection.id === id);
}

/** Domain claims waiting for or holding instance approval, by organization and domain. */
export const domainClaims = [
  {
    organization: "acme",
    domain: "acme.dev",
    approved: true,
    requestedBy: "Aisha Khan · owner",
    requested: "Oct 18",
    connection: "Okta · SAML · Active",
    affected: "17 with acme.dev emails",
    record: "_preface-challenge.acme.dev",
    value: "preface-verify=1b9e…40c2",
    verified: "Oct 2, 2026 · rechecked 6h ago",
    expires: "Oct 2, 2027",
  },
  {
    organization: "acme",
    domain: "contractors.acme.dev",
    approved: false,
    requestedBy: "Jon Smith · admin",
    requested: "Oct 16",
    connection: "Microsoft Entra ID · OIDC · Tested",
    affected: "4 with contractors.acme.dev emails",
    record: "_preface-challenge.contractors.acme.dev",
    value: "preface-verify=93d0…7e11",
    verified: "Oct 16, 2026 · rechecked 2h ago",
    expires: "Oct 16, 2027",
  },
] as const;
