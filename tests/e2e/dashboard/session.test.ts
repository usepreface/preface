import { onboardOwner, createOrganization } from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("returning owner without an organization signs in through the dashboard", async ({
  page,
  api,
  backend,
  mailbox,
}) => {
  const owner = await onboardOwner(api, backend, mailbox);
  await page.goto(`${backend.dashboard}/organizations`);
  await expect(
    page.getByText("You’re not in an organization yet.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in\/?$/);
  await page.getByLabel("Email", { exact: true }).fill(owner.email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Email me a code", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in\/verify$/);
  await page.getByLabel("Verification code", { exact: true }).fill(await mailbox.code(owner.email));
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/organizations\/?$/);
  await expect(page.getByRole("link", { name: "New organization", exact: true })).toBeVisible();
  await expect(
    page.getByText("You’re not in an organization yet.", { exact: false }),
  ).toBeVisible();
});

test("shared query cache survives an operational failure and clears after confirmed session revocation", async ({
  page,
  api,
  backend,
  mailbox,
}) => {
  await onboardOwner(api, backend, mailbox);
  await createOrganization(api);
  let directoryRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "GET" && new URL(request.url()).pathname === "/api/v1/organizations")
      directoryRequests += 1;
  });
  await page.goto(`${backend.dashboard}/organizations`);
  await expect(
    page.getByRole("heading", { name: "Choose an organization", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Open", exact: true })).toBeVisible();
  expect(directoryRequests, "Loader and component share one atom registry").toBe(1);
  await page.getByRole("link", { name: "Open", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Welcome to/ })).toBeVisible();

  await page.route("**/api/v1/auth/session", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ _tag: "RequestError", code: "SERVICE_UNAVAILABLE" }),
    }),
  );
  const failedRefresh = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/auth/session" && response.status() === 503,
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await failedRefresh;
  await expect(page.getByRole("heading", { name: /Welcome to/ })).toBeVisible();
  await expect(page).not.toHaveURL(/\/sign-in/);

  await page.unroute("**/api/v1/auth/session");
  expect((await api.request("/auth/session", "DELETE")).status()).toBe(204);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page).toHaveURL(/\/sign-in\/?$/);
  await expect(page.getByRole("heading", { name: /Welcome to/ })).toHaveCount(0);
  await page.goto(`${backend.dashboard}/organizations`);
  await expect(page).toHaveURL(/\/sign-in\/?$/);
});

test("a background profile refresh keeps dirty input and saves only the edited fields", async ({
  page,
  api,
  backend,
  mailbox,
}) => {
  const owner = await onboardOwner(api, backend, mailbox);
  await page.goto(`${backend.dashboard}/account/profile`);
  await page.getByLabel("Display name", { exact: true }).fill("Edited Operator");
  expect(
    (await api.request("/users/me", "PATCH", { metadata: { title: "New server title" } })).status(),
  ).toBe(200);
  const refreshed = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/users/me" &&
      response.request().method() === "GET",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await refreshed;
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue("Edited Operator");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("New server title");
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.getByText("Edited Operator", { exact: true }).last()).toBeVisible();
  expect(owner.actor.user.metadata.name).toBe("Operator");
});
