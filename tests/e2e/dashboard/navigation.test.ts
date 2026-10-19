import { currentOrganization, onboardOwner } from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("navigation retains the shell while route code and page data load independently", async ({
  page,
  api,
  backend,
  mailbox,
}) => {
  await onboardOwner(api, backend, mailbox);
  await currentOrganization(api);
  await page.goto(`${backend.dashboard}/settings/general`);
  await expect(page.getByRole("form", { name: "Organization details" })).toBeVisible();
  const sidebar = page.getByRole("navigation", { name: "Fixture Company", exact: true });
  await sidebar.evaluate((element) => element.setAttribute("data-navigation-marker", "retained"));
  await page.clock.install();

  const codeRequested = Promise.withResolvers<void>();
  const codeReady = Promise.withResolvers<void>();
  const teamsRequested = Promise.withResolvers<void>();
  const teamsReady = Promise.withResolvers<void>();
  await page.route("**/assets/*.js", async (route) => {
    codeRequested.resolve();
    await codeReady.promise;
    await route.continue();
  });
  await page.route("**/api/v1/organization/teams?*", async (route) => {
    teamsRequested.resolve();
    await teamsReady.promise;
    await route.continue();
  });

  try {
    await page
      .getByRole("navigation", { name: "Settings", exact: true })
      .first()
      .getByRole("link", { name: "Teams", exact: true })
      .click();
    await codeRequested.promise;
    await page.clock.fastForward(1_500);
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-navigation-marker", "retained");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("status", { name: "Loading content" }),
    ).toBeVisible();

    codeReady.resolve();
    await teamsRequested.promise;
    await expect(page.getByRole("heading", { name: "Teams", exact: true })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Settings", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("status", { name: "Loading content" }),
    ).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-navigation-marker", "retained");

    teamsReady.resolve();
    await expect(page.getByText("Create your first team", { exact: true })).toBeVisible();
    await expect(page.getByRole("status", { name: "Loading content" })).toHaveCount(0);
  } finally {
    codeReady.resolve();
    teamsReady.resolve();
    await page.unrouteAll({ behavior: "wait" });
  }
});
