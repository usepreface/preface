import type { Page } from "@playwright/test";
import {
  ExternalIdentityStartResult,
  PublicOrganizationAuthPolicy,
  OrganizationRoleList,
  PublicInvitation,
  PublicOidcConnection,
  PublicOrganizationDomain,
  PublicSamlConnection,
  ConnectionDomains,
} from "@usepreface/protocol/dto";

import type { AuthApi } from "./api.js";
import type { Realm } from "./keycloak.js";
import type { Mailbox } from "./mailbox.js";
import { authenticateAtKeycloak } from "./onboarding.js";

export async function configureOidc(api: AuthApi, realm: Realm, page: Page) {
  const path = `/organization/identity-connections`;
  await realm.user("operator", "owner@company.example.test");
  await realm.oidc(`${api.origin}/api/v1/auth/oidc/callback`);
  let connection = await api.json(
    PublicOidcConnection,
    path,
    "POST",
    {
      name: "Keycloak OIDC",
      issuer: realm.issuer,
      clientId: "preface-oidc",
      clientSecret: realm.clientSecret,
      clientAuthenticationMethod: "client_secret_basic",
    },
    201,
  );
  const started = await api.json(
    ExternalIdentityStartResult,
    `${path}/${connection.id}/test`,
    "POST",
    { expectedRevision: connection.revision },
  );
  await authenticateAtKeycloak(
    page,
    started.authorizationUrl,
    "operator",
    realm.password,
    api.dashboard,
  );
  connection = await api.json(PublicOidcConnection, `${path}/${connection.id}/activate`, "POST", {
    expectedRevision: connection.revision,
  });
  return connection;
}

export async function configureSaml(api: AuthApi, realm: Realm, page: Page) {
  const path = `/organization/identity-connections`;
  await realm.user("operator", "owner@company.example.test");
  let connection = await api.json(
    PublicSamlConnection,
    `${path}/saml`,
    "POST",
    { name: "Keycloak SAML" },
    201,
  );
  const client = await realm.saml(connection.configuration);
  connection = await api.json(PublicSamlConnection, `${path}/${connection.id}/saml`, "PATCH", {
    expectedRevision: connection.revision,
    idp: {
      entityId: realm.issuer,
      signOnUrl: `${realm.issuer}/protocol/saml`,
      signingCertificates: [client.certificate],
      nameIdFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
      emailAttribute: "email",
    },
  });
  const started = await api.json(
    ExternalIdentityStartResult,
    `${path}/${connection.id}/test`,
    "POST",
    { expectedRevision: connection.revision },
  );
  await authenticateAtKeycloak(
    page,
    started.authorizationUrl,
    "operator",
    realm.password,
    api.dashboard,
  );
  connection = await api.json(PublicSamlConnection, `${path}/${connection.id}/activate`, "POST", {
    expectedRevision: connection.revision,
  });
  return { connection, client };
}

export async function approveConnection(
  api: AuthApi,
  connection: { id: string; revision: number; provider: "oidc" | "saml" },
  trustDomain = true,
) {
  const base = `/organization`;
  const policy = await api.json(PublicOrganizationAuthPolicy, `${base}/auth-policy`);
  await api.json(PublicOrganizationAuthPolicy, `${base}/auth-policy`, "PATCH", {
    expectedRevision: policy.revision,
    [connection.provider === "oidc" ? "oidcConnectionIds" : "samlConnectionIds"]: [connection.id],
  });
  if (!trustDomain) return;
  const domain = await api.json(PublicOrganizationDomain, `${base}/domains`, "POST", {
    domain: "company.example.test",
  });
  await api.json(
    PublicOrganizationDomain,
    `/instance/organization/domains/${domain.id}/approve`,
    "POST",
    { expectedRevision: domain.revision },
  );
  await api.json(
    ConnectionDomains,
    `${base}/identity-connections/${connection.id}/domains`,
    "PUT",
    { expectedRevision: connection.revision, domainIds: [domain.id] },
  );
}

export async function inviteMember(
  api: AuthApi,
  mailbox: Mailbox,
  email: string,
  teams: readonly { teamId: string }[] = [],
) {
  const roles = await api.json(OrganizationRoleList, `/organization/roles`);
  const member = roles.roles.find((role) => role.key === "member");
  if (!member) throw new Error("Missing built-in member role");
  const invitation = await api.json(
    PublicInvitation,
    `/organization/invitations`,
    "POST",
    { email, roleIds: [member.id], teams },
    201,
  );
  const proof = await mailbox.invitation(email);
  if (proof.invitationId !== invitation.id) throw new Error("Email belongs to another invitation");
  return proof;
}
