import { OrganizationList, TeamList, OrganizationMemberList } from "@usepreface/protocol/dto";

import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("dashboard setup, team creation and invitation admission persist through the real API", async ({
  page,
  backend,
  api,
  mailbox,
  browser,
}) => {
  await page.goto(`${backend.dashboard}/setup#token=${backend.token}`);
  await page.getByLabel("Instance name", { exact: true }).fill("Dashboard fixture");
  await page.getByLabel("Owner display name").fill("Operator");
  await page.getByLabel("Owner email").fill("owner@company.example.test");
  await page.getByRole("button", { name: "Send verification code", exact: true }).click();
  await expect(page).toHaveURL(/\/setup\/verify$/);
  const code = await mailbox.code("owner@company.example.test");
  await page.getByLabel("Verification code", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page).toHaveURL(/\/setup\/organization$/);
  await page.getByLabel("Organization name", { exact: true }).fill("Knowledge");
  await page.getByRole("button", { name: "Create organization", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Knowledge is ready" })).toBeVisible();
  await page.getByRole("link", { name: "Open Knowledge", exact: true }).click();
  await expect(page).toHaveURL(/\/org\/knowledge\/?$/);
  await expect(page.getByRole("heading", { name: "Welcome to Knowledge, Operator" })).toBeVisible();
  await page.getByLabel("Email to invite", { exact: true }).fill("quick@company.example.test");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByText("Invitation queued", { exact: true })).toBeVisible();
  expect((await mailbox.invitation("quick@company.example.test")).invitationId).toBeTruthy();

  const organizations = await api.json(OrganizationList, "/organizations");
  const organization = organizations.organizations[0];
  expect(organization?.metadata.name).toBe("Knowledge");
  if (!organization) throw new Error("Missing created organization");

  await page.goto(`${backend.dashboard}/org/knowledge/settings/teams`);
  await page.getByRole("button", { name: "Create team", exact: true }).click();
  await page.getByLabel("Team name", { exact: true }).fill("Support");
  await page.getByRole("button", { name: "Save team", exact: true }).click();
  await expect(page.getByRole("link", { name: "Support", exact: true })).toBeVisible();
  const teams = await api.json(TeamList, `/organizations/${organization.id}/teams`);
  expect(teams.teams.map((team) => team.metadata.name)).toEqual(["Support"]);

  await page.goto(`${backend.dashboard}/org/knowledge/settings/members`);
  await page.getByRole("button", { name: "Invite members", exact: true }).click();
  const emails = page.getByLabel("Email addresses", { exact: true });
  await emails.fill("alice@company.example.test");
  await emails.press("Enter");
  await page.getByRole("button", { name: "Assign a team", exact: true }).click();
  await page.getByRole("button", { name: "Send invitations", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const invitation = await mailbox.invitation("alice@company.example.test");
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const alice = await context.newPage();
    await alice.goto(`${backend.dashboard}/invitations/accept#${new URLSearchParams(invitation)}`);
    await alice.getByRole("button", { name: "Review invitation", exact: true }).click();
    await alice.getByLabel("Your display name", { exact: true }).fill("Alice");
    await alice.getByRole("button", { name: "Email me a verification code", exact: true }).click();
    await alice
      .getByLabel("Verification code", { exact: true })
      .fill(await mailbox.code("alice@company.example.test"));
    await alice.getByRole("button", { name: "Accept invitation", exact: true }).click();
    await expect(alice).toHaveURL(/\/organizations\/?$/);
    await alice.getByRole("link", { name: "Open", exact: true }).click();
    await expect(alice.getByRole("heading", { name: "Welcome to Knowledge, Alice" })).toBeVisible();
    const members = await api.json(
      OrganizationMemberList,
      `/organizations/${organization.id}/members`,
    );
    expect(members.members.some((member) => member.metadata.name === "Alice")).toBe(true);
    await alice.goto(`${backend.dashboard}/org/knowledge/settings/members`);
    await expect(alice.getByRole("heading", { name: "Members", exact: true })).toBeVisible();
    await expect(alice.getByRole("button", { name: "Actions for Alice", exact: true })).toHaveCount(
      0,
    );

    await page.goto(`${backend.dashboard}/org/knowledge/settings/roles`);
    await page.getByRole("button", { name: "Create role", exact: true }).click();
    await page.getByLabel("Name", { exact: true }).fill("Audit reviewer");
    await page.getByLabel("Key", { exact: true }).fill("audit-reviewer");
    await page.getByRole("checkbox", { name: "View activity history", exact: true }).check();
    await page.getByRole("button", { name: "Save role", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Audit reviewer", exact: true })).toBeVisible();
    await page.goto(`${backend.dashboard}/org/knowledge/settings/members`);
    const aliceRow = page.getByRole("row").filter({ hasText: "Alice" });
    await aliceRow.getByRole("button", { name: "Actions for Alice", exact: true }).click();
    await page.getByRole("menuitem", { name: "Manage roles", exact: true }).click();
    await page.getByRole("checkbox", { name: "Audit reviewer", exact: true }).check();
    await page.getByRole("button", { name: "Save roles", exact: true }).click();
    await expect(aliceRow).toContainText("Audit reviewer");

    const support = teams.teams[0];
    if (!support) throw new Error("Missing Support team");
    await page.goto(`${backend.dashboard}/org/knowledge/settings/teams/${support.id}`);
    const teamAlice = page.getByRole("row").filter({ hasText: "Alice" });
    await teamAlice.getByRole("button", { name: "Actions for Alice", exact: true }).click();
    await page.getByRole("menuitem", { name: "Manage roles", exact: true }).click();
    await page.getByRole("checkbox", { name: "Team administrator", exact: true }).check();
    await page.getByRole("button", { name: "Save roles", exact: true }).click();
    await expect(teamAlice).toContainText("Team administrator");

    await page.goto(`${backend.dashboard}/org/knowledge/settings/roles`);
    await page.getByRole("button", { name: "Create role", exact: true }).click();
    await page.getByLabel("Name", { exact: true }).fill("Invitation coordinator");
    await page.getByLabel("Key", { exact: true }).fill("invitation-coordinator");
    await page.getByRole("checkbox", { name: "View organization", exact: true }).check();
    await page.getByRole("checkbox", { name: "View members", exact: true }).check();
    await page.getByRole("checkbox", { name: "Invite, suspend and remove", exact: true }).check();
    await page.getByRole("checkbox", { name: "View roles", exact: true }).check();
    await page.getByRole("checkbox", { name: "Assign roles", exact: true }).check();
    await page.getByRole("button", { name: "Save role", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Invitation coordinator", exact: true }),
    ).toBeVisible();
    await page.goto(`${backend.dashboard}/org/knowledge/settings/members`);
    await aliceRow.getByRole("button", { name: "Actions for Alice", exact: true }).click();
    await page.getByRole("menuitem", { name: "Manage roles", exact: true }).click();
    await page.getByRole("checkbox", { name: "Invitation coordinator", exact: true }).check();
    await page.getByRole("checkbox", { name: "Member", exact: true }).uncheck();
    await page.getByRole("checkbox", { name: "Audit reviewer", exact: true }).uncheck();
    await page.getByRole("button", { name: "Save roles", exact: true }).click();
    await expect(aliceRow).toContainText("Invitation coordinator");

    // Inviting does not require the unrelated team directory permission.
    await alice.goto(`${backend.dashboard}/org/knowledge/settings/members`);
    await alice.getByRole("button", { name: "Invite members", exact: true }).click();
    await expect(alice.getByRole("button", { name: "Assign a team", exact: true })).toHaveCount(0);
    await expect(alice.getByRole("checkbox", { name: "Member", exact: true })).toHaveCount(0);
    await alice.getByRole("checkbox", { name: "Invitation coordinator", exact: true }).check();
    await alice.getByLabel("Email addresses", { exact: true }).fill("bob@company.example.test");
    await alice.getByLabel("Email addresses", { exact: true }).press("Enter");
    await alice.getByRole("button", { name: "Send invitations", exact: true }).click();
    await expect(alice.getByRole("dialog")).toHaveCount(0);
    expect((await mailbox.invitation("bob@company.example.test")).invitationId).toBeTruthy();
    await alice.goto(`${backend.dashboard}/org/knowledge`);
    await expect(alice.getByRole("heading", { name: "Welcome to Knowledge, Alice" })).toBeVisible();

    await page.goto(`${backend.dashboard}/org/knowledge/settings/members`);
    await aliceRow.getByRole("button", { name: "Actions for Alice", exact: true }).click();
    await page.getByRole("menuitem", { name: "Suspend", exact: true }).click();
    await page.getByRole("button", { name: "Confirm change", exact: true }).click();
    await expect(aliceRow).toContainText("Suspended");
    await alice.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(alice.getByRole("heading", { name: "Welcome to Knowledge, Alice" })).toHaveCount(
      0,
    );
    await expect(alice).toHaveURL(/\/org\/knowledge\/?$/);
  } finally {
    await context.close();
  }
});
