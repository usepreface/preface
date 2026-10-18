import {
  PublicOidcConnection,
  OrganizationIdentityConnectionList,
  PublicSamlConnection,
  PublicOrganizationAuthPolicy,
  OrganizationRoleList,
} from "@usepreface/protocol/dto";

import {
  onboardOwner,
  createOrganization,
  authenticateAtKeycloak,
} from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("OIDC is configured and activated in the dashboard, then an invitation admits a first-time SSO user", async ({
  page,
  api,
  backend,
  mailbox,
  realm,
  browser,
}) => {
  await onboardOwner(api, backend, mailbox);
  const { organization } = await createOrganization(api);
  await realm.user("operator", "owner@company.example.test");
  await realm.user("alice", "alice@company.example.test");
  await realm.oidc(`${backend.origin}/api/v1/auth/oidc/callback`);
  const connectionsPath = `/organizations/${organization.id}/identity-connections`;
  await page.goto(`${backend.dashboard}/org/company/settings/connections`);
  await page.getByRole("button", { name: "Add connection", exact: true }).click();
  await page.getByLabel("Connection name", { exact: true }).fill("Company OIDC");
  await page.getByLabel("Issuer URL", { exact: true }).fill(realm.issuer);
  await page.getByLabel("Client ID", { exact: true }).fill("preface-oidc");
  await page.getByLabel("Client secret", { exact: true }).fill(realm.clientSecret);
  await page.getByRole("button", { name: "Create connection", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/connections\/[0-9a-f-]+$/);
  const list = await api.json(OrganizationIdentityConnectionList, connectionsPath);
  const created = list.connections[0];
  if (!created || created.provider !== "oidc") throw new Error("Missing OIDC draft");
  await page.getByRole("button", { name: "Test login", exact: true }).click();
  await page.waitForURL((url) => url.origin !== backend.dashboard);
  await authenticateAtKeycloak(page, page.url(), "operator", realm.password, backend.dashboard);
  await page.goto(`${backend.dashboard}/org/company/settings/connections/${created.id}`);
  await page.getByRole("button", { name: "Activate tested revision", exact: true }).click();
  await expect(page.getByText(/OIDC · active · revision/)).toBeVisible();
  const activated = await api.json(PublicOidcConnection, `${connectionsPath}/${created.id}`);
  expect(activated.status).toBe("active");
  await page.getByLabel("Connection name", { exact: true }).fill("Company OIDC Updated");
  await page.getByRole("button", { name: "Save connection", exact: true }).click();
  await expect
    .poll(
      async () => (await api.json(PublicOidcConnection, `${connectionsPath}/${created.id}`)).name,
    )
    .toBe("Company OIDC Updated");
  expect(
    (await api.json(PublicOidcConnection, `${connectionsPath}/${created.id}`)).hasClientSecret,
  ).toBe(true);

  await page.goto(`${backend.dashboard}/org/company/settings/authentication`);
  await page.getByRole("checkbox", { name: "Company OIDC Updated", exact: false }).check();
  await page.getByRole("button", { name: "Save login policy", exact: true }).click();
  await expect
    .poll(
      async () =>
        (
          await api.json(
            PublicOrganizationAuthPolicy,
            `/organizations/${organization.id}/auth-policy`,
          )
        ).oidcConnectionIds,
    )
    .toContain(created.id);
  const roles = await api.json(OrganizationRoleList, `/organizations/${organization.id}/roles`);
  const memberRole = roles.roles.find((role) => role.key === "member");
  if (!memberRole) throw new Error("Missing member role");
  expect(
    (
      await api.request(`/organizations/${organization.id}/invitations`, "POST", {
        email: "alice@company.example.test",
        roleIds: [memberRole.id],
      })
    ).status(),
  ).toBe(201);
  const invitation = await mailbox.invitation("alice@company.example.test");
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const alice = await context.newPage();
    await alice.goto(`${backend.dashboard}/invitations/accept#${new URLSearchParams(invitation)}`);
    await alice.getByRole("button", { name: "Review invitation", exact: true }).click();
    await alice.getByLabel("Your display name", { exact: true }).fill("Alice");
    await alice
      .getByRole("button", { name: "Continue with Company OIDC Updated", exact: true })
      .click();
    await alice.waitForURL((url) => url.origin !== backend.dashboard);
    await authenticateAtKeycloak(alice, alice.url(), "alice", realm.password, backend.dashboard);
    await expect(
      alice.getByRole("heading", { name: "Choose an organization", exact: true }),
    ).toBeVisible();
    await alice.getByRole("link", { name: "Open", exact: true }).click();
    await expect(
      alice.getByRole("heading", { name: "Welcome to Fixture Company, Alice", exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("SAML metadata and IdP settings are configured and browser-tested through the dashboard", async ({
  page,
  api,
  backend,
  mailbox,
  realm,
}) => {
  await onboardOwner(api, backend, mailbox);
  const { organization } = await createOrganization(api);
  await realm.user("operator", "owner@company.example.test");
  const base = `/organizations/${organization.id}/identity-connections`;
  await page.goto(`${backend.dashboard}/org/company/settings/connections`);
  await page.getByRole("button", { name: "Add connection", exact: true }).click();
  await page.getByRole("radio", { name: "SAML 2.0", exact: true }).check();
  await page.getByLabel("Connection name", { exact: true }).fill("Company SAML");
  await page.getByRole("button", { name: "Create connection", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/connections\/[0-9a-f-]+$/);
  const listed = await api.json(OrganizationIdentityConnectionList, base);
  const connection = listed.connections[0];
  if (!connection || connection.provider !== "saml") throw new Error("Missing SAML draft");
  const provider = await realm.saml(connection.configuration);
  await page.getByLabel("IdP entity ID", { exact: true }).fill(realm.issuer);
  await page.getByLabel("Sign-on URL", { exact: true }).fill(`${realm.issuer}/protocol/saml`);
  await page.getByLabel("Email attribute", { exact: true }).fill("email");
  await page.getByLabel("IdP signing certificate 1", { exact: true }).fill(provider.certificate);
  await page.getByRole("button", { name: "Save identity provider", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await api.json(PublicSamlConnection, `${base}/${connection.id}`)).configuration.idp
          ?.entityId,
    )
    .toBe(realm.issuer);
  await page.getByRole("button", { name: "Test login", exact: true }).click();
  await page.waitForURL((url) => url.origin !== backend.dashboard);
  await authenticateAtKeycloak(page, page.url(), "operator", realm.password, backend.dashboard);
  await page.goto(`${backend.dashboard}/org/company/settings/connections/${connection.id}`);
  await page.getByRole("button", { name: "Activate tested revision", exact: true }).click();
  await expect(page.getByText(/SAML · active · revision/)).toBeVisible();
  expect((await api.json(PublicSamlConnection, `${base}/${connection.id}`)).status).toBe("active");
});
