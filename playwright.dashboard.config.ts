import { defineConfig } from "@playwright/test";

import authConfig from "./playwright.config.js";

export default defineConfig({
  ...authConfig,
  testDir: "./tests/e2e/dashboard",
  timeout: 120_000,
  use: { ...authConfig.use, actionTimeout: 15_000, navigationTimeout: 30_000 },
});
