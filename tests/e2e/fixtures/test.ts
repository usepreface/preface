import { randomBytes } from "node:crypto";

import { test as base, expect } from "@playwright/test";

import { AuthApi } from "./api.js";
import { startBackend, type Backend } from "./backend.js";
import { startInfrastructure, type Infrastructure } from "./infrastructure.js";
import { createRealm, type Realm } from "./keycloak.js";
import { Mailbox } from "./mailbox.js";

interface AuthFixtures {
  dashboardUI: boolean;
  backend: Backend;
  api: AuthApi;
  realm: Realm;
  mailbox: Mailbox;
  database: string;
}
export const test = base.extend<AuthFixtures, { infrastructure: Infrastructure }>({
  dashboardUI: [false, { option: true }],
  infrastructure: [
    // Playwright requires a destructured fixture parameter, even without dependencies.
    // oxlint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const infrastructure = await startInfrastructure();
      try {
        await use(infrastructure);
      } finally {
        await infrastructure.close();
      }
    },
    { scope: "worker", timeout: 240_000 },
  ],
  database: async ({ infrastructure }, use) => {
    const database = `auth_${randomBytes(8).toString("hex")}`;
    const created = await infrastructure.postgres.exec([
      "psql",
      "-U",
      "preface_test",
      "-d",
      "preface_test",
      "-c",
      `CREATE DATABASE ${database}`,
    ]);
    expect(created.exitCode, created.output).toBe(0);
    try {
      await use(database);
    } finally {
      const dropped = await infrastructure.postgres.exec([
        "psql",
        "-U",
        "preface_test",
        "-d",
        "preface_test",
        "-c",
        `DROP DATABASE ${database} WITH (FORCE)`,
      ]);
      expect(dropped.exitCode, dropped.output).toBe(0);
    }
  },
  backend: async ({ infrastructure, database, dashboardUI }, use, testInfo) => {
    const backend = await startBackend(infrastructure, database, dashboardUI);
    try {
      await use(backend);
    } finally {
      await backend.close();
      if (testInfo.status !== testInfo.expectedStatus)
        await testInfo.attach("backend.log", { body: backend.output, contentType: "text/plain" });
    }
  },
  realm: async ({ infrastructure }, use) => {
    const realm = await createRealm(infrastructure, `auth-${randomBytes(8).toString("hex")}`);
    try {
      await use(realm);
    } finally {
      await realm.close();
    }
  },
  api: async ({ context, backend }, use) => {
    await use(new AuthApi(context, backend.origin, backend.dashboard));
  },
  mailbox: async ({ infrastructure }, use) => {
    const cleared = await infrastructure.control.delete(
      `${infrastructure.mailOrigin}/api/v1/messages`,
    );
    expect(cleared.ok()).toBe(true);
    await use(new Mailbox(infrastructure));
  },
});
export { expect };
