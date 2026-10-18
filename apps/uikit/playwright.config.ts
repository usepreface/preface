import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../../tests/e2e/uikit",
  forbidOnly: process.env.CI !== undefined,
  workers: 1,
  outputDir: "../../test-results/uikit",
  use: {
    baseURL: "http://127.0.0.1:5175",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter @usepreface/uikit dev --host 127.0.0.1 --port 5175 --strictPort",
    cwd: "../..",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: false,
  },
});
