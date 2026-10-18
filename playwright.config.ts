import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e/auth",
  fullyParallel: false,
  forbidOnly: process.env.CI !== undefined,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    browserName: "chromium",
    // Only local, generated fixture certificates; no system trust changes.
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
