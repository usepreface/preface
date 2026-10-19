import { configureOidc, approveConnection, inviteMember } from "../fixtures/connections.js";
import { ageInvitationDelivery } from "../fixtures/invitation-delivery.js";
import {
  onboardOwner,
  currentOrganization,
  authenticateAtKeycloak,
} from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("dashboard resumes an SSO invitation after fresh mailbox verification", async ({
  page,
  api,
  backend,
  mailbox,
  realm,
  browser,
  infrastructure,
  database,
}) => {
  await onboardOwner(api, backend, mailbox);
  await currentOrganization(api);
  const connection = await configureOidc(api, realm, page);
  await approveConnection(api, connection, false);
  await realm.user("contractor", "contractor@outside.example.test");
  const invitation = await inviteMember(api, mailbox, "contractor@outside.example.test");
  // The invitation is valid, but an old delivery no longer proves recent mailbox access.
  const aged = await ageInvitationDelivery(infrastructure, database, invitation.invitationId);
  expect(aged.exitCode, aged.output).toBe(0);
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const contractor = await context.newPage();
    await contractor.goto(
      `${backend.dashboard}/invitations/accept#${new URLSearchParams(invitation)}`,
    );
    await contractor.getByRole("button", { name: "Review invitation", exact: true }).click();
    await contractor.getByLabel("Your display name", { exact: true }).fill("Contractor");
    await contractor
      .getByRole("button", { name: "Continue with Keycloak OIDC", exact: true })
      .click();
    await contractor.waitForURL((url) => url.origin !== backend.dashboard);
    await authenticateAtKeycloak(
      contractor,
      contractor.url(),
      "contractor",
      realm.password,
      backend.dashboard,
    );
    await expect(contractor).toHaveURL(/\/auth\/verify-email\?flowId=/);
    await contractor.getByRole("button", { name: "Email me a code", exact: true }).click();
    await contractor
      .getByLabel("Verification code", { exact: true })
      .fill(await mailbox.code("contractor@outside.example.test"));
    await contractor.getByRole("button", { name: "Verify and continue", exact: true }).click();
    await expect(contractor).toHaveURL(/\/$/);

    await expect(
      contractor.getByRole("heading", {
        name: "Welcome to Fixture Company, Contractor",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
