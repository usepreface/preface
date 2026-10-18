import {
  PublicOrganizationAuthPolicy,
  OrganizationDomainList,
  ConnectionDomains,
} from "@usepreface/protocol/dto";

import { configureOidc, approveConnection } from "../fixtures/connections.js";
import {
  onboardOwner,
  createOrganization,
  completeKeycloakAuthentication,
  signInWithEmail,
} from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("owners prepare required SSO, verify a domain, and recover with their one-time offline credential", async ({
  page,
  api,
  backend,
  mailbox,
  realm,
}) => {
  await onboardOwner(api, backend, mailbox);
  const { organization } = await createOrganization(api);
  const connection = await configureOidc(api, realm, page, organization.id);
  await approveConnection(api, organization.id, { ...connection, provider: "oidc" }, false);

  await page.goto(`${backend.dashboard}/account/security`);
  await page.getByRole("button", { name: "Fixture Company", exact: true }).click();
  const linking = page.waitForEvent("framenavigated", {
    predicate: (frame) => frame === page.mainFrame(),
  });
  await page.getByRole("button", { name: "Link Keycloak OIDC", exact: true }).click();
  await linking;
  await completeKeycloakAuthentication(page, "operator", realm.password, backend.dashboard);

  await page.goto(`${backend.dashboard}/org/company/settings/domains`);
  await page.getByLabel("Domain", { exact: true }).fill("company.example.test");
  await page.getByRole("button", { name: "Add domain", exact: true }).click();
  await page.getByRole("button", { name: "Close", exact: true }).first().click();
  await page.getByRole("link", { name: "Operator review", exact: true }).click();
  await page.getByRole("button", { name: "Approve exact claim", exact: true }).click();
  await page.getByRole("textbox").fill("company.example.test");
  await page.getByRole("button", { name: "Confirm decision", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await api.json(OrganizationDomainList, `/organizations/${organization.id}/domains`))
          .domains[0]?.verificationMethod,
    )
    .toBe("operator");
  await page.goto(`${backend.dashboard}/org/company/settings/connections/${connection.id}`);
  await page.getByRole("checkbox", { name: "company.example.test", exact: true }).check();
  await page.getByRole("button", { name: "Save trusted domains", exact: true }).click();
  await expect
    .poll(async () =>
      (
        await api.json(
          ConnectionDomains,
          `/organizations/${organization.id}/identity-connections/${connection.id}/domains`,
        )
      ).domains.map((domain) => domain.domain),
    )
    .toEqual(["company.example.test"]);

  await page.goto(`${backend.dashboard}/account/security`);
  await page.getByRole("button", { name: "Fixture Company", exact: true }).click();
  const confirming = page.waitForEvent("framenavigated", {
    predicate: (frame) => frame === page.mainFrame(),
  });
  await page.getByRole("button", { name: "Confirm Keycloak OIDC", exact: true }).click();
  await confirming;
  await completeKeycloakAuthentication(page, "operator", realm.password, backend.dashboard);
  await page.goto(`${backend.dashboard}/org/company/settings/authentication`);
  await page.getByRole("button", { name: "Generate replacement credential", exact: true }).click();
  await page.getByRole("button", { name: "Generate credential", exact: true }).click();
  const credential = await page.getByLabel("Recovery credential", { exact: true }).textContent();
  if (!credential) throw new Error("Recovery credential was not displayed");
  await page.getByRole("button", { name: "I have saved it", exact: true }).click();
  await expect(page.getByLabel("Recovery credential", { exact: true })).toHaveCount(0);
  await page.getByRole("radio", { name: "Required", exact: true }).check();
  await page.getByLabel("Offline recovery credential", { exact: true }).fill(credential);
  await page.getByRole("button", { name: "Save login policy", exact: true }).click();
  await expect
    .poll(
      async () =>
        (
          await api.json(
            PublicOrganizationAuthPolicy,
            `/organizations/${organization.id}/auth-policy`,
          )
        ).ssoMode,
    )
    .toBe("required");

  expect((await api.request("/auth/session", "DELETE")).status()).toBe(204);
  await signInWithEmail(api, mailbox, "owner@company.example.test");
  await page.goto(`${backend.dashboard}/org/company`);
  await expect(
    page.getByRole("heading", { name: "Continue with organization SSO", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Owner recovery", exact: true }).click();
  await page.getByLabel("Recovery credential", { exact: true }).fill(credential);
  await page.getByRole("button", { name: "Recover organization access", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome to Fixture Company, Operator", exact: true }),
  ).toBeVisible();
  expect(
    (await api.json(PublicOrganizationAuthPolicy, `/organizations/${organization.id}/auth-policy`))
      .ssoMode,
  ).toBe("optional");

  await page.goto(`${backend.dashboard}/org/company/settings/audit`);
  await expect(
    page.getByRole("button", { name: "View details", exact: true }).first(),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
});
