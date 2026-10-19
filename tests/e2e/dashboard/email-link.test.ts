import { onboardOwner } from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test.use({ dashboardUI: true });

test("dashboard email links reject a different browser and finish in the requesting browser", async ({
  page,
  api,
  backend,
  mailbox,
  browser,
}) => {
  const owner = await onboardOwner(api, backend, mailbox);
  expect((await api.request("/auth/session", "DELETE")).status()).toBe(204);
  await page.goto(`${backend.dashboard}/sign-in`);
  await page.getByLabel("Work email", { exact: true }).fill(owner.email);
  await page.getByRole("button", { name: "Email me a code", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in\/verify$/);
  const link = await mailbox.signInLink(owner.email);
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const stranger = await context.newPage();
    await stranger.goto(link.href);
    await stranger.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      stranger.getByText("This code or link is invalid or expired. Request a new one.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(stranger).toHaveURL(/\/auth\/email\/verify$/);
  } finally {
    await context.close();
  }
  await page.goto(link.href);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Welcome to/ })).toBeVisible();
});
