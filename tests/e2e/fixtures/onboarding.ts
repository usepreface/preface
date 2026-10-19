import { expect, type Page } from "@playwright/test";
import {
  BootstrapVerification,
  EmailSignInChallenge,
  OrganizationDetail,
  SessionActor,
} from "@usepreface/protocol/dto";

import type { AuthApi } from "./api.js";
import type { Backend } from "./backend.js";
import type { Mailbox } from "./mailbox.js";

export async function onboardOwner(api: AuthApi, backend: Backend, mailbox: Mailbox) {
  const email = "owner@company.example.test";
  const challenge = await api.json(
    BootstrapVerification,
    "/instance/setup",
    "POST",
    {
      token: backend.token,
      organizationName: "Fixture Company",
      ownerName: "Operator",
      email,
    },
    202,
  );
  const code = await mailbox.code(email);
  const actor = await api.json(
    SessionActor,
    "/instance/setup/verify",
    "POST",
    {
      token: backend.token,
      challengeId: challenge.challengeId,
      code,
    },
    201,
  );
  return { email, actor };
}

export async function currentOrganization(api: AuthApi) {
  return api.json(OrganizationDetail, "/organization");
}

export async function signInWithEmail(api: AuthApi, mailbox: Mailbox, email: string) {
  const challenge = await api.json(
    EmailSignInChallenge,
    "/auth/email/request",
    "POST",
    { email },
    202,
  );
  const code = await mailbox.code(email);
  return api.json(
    SessionActor,
    "/auth/email/verify",
    "POST",
    { challengeId: challenge.challengeId, method: "code", code },
    201,
  );
}

export async function authenticateAtKeycloak(
  page: Page,
  authorizationUrl: string,
  username: string,
  password: string,
  dashboard: string,
) {
  await page.goto(authorizationUrl);
  await completeKeycloakAuthentication(page, username, password, dashboard);
}

export async function completeKeycloakAuthentication(
  page: Page,
  username: string,
  password: string,
  dashboard: string,
) {
  await expect
    .poll(
      async () =>
        new URL(page.url()).origin === dashboard ||
        (await page.getByLabel("Password", { exact: true }).isVisible()),
    )
    .toBe(true);
  if (new URL(page.url()).origin !== dashboard) {
    const usernameField = page.getByLabel("Username or email");
    if (await usernameField.isVisible()) await usernameField.fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
  }
  await page.waitForURL((url) => url.origin === dashboard);
  expect(
    new URL(page.url()).pathname,
    "Provider callback completed without an authentication error",
  ).not.toBe("/auth/error");
}
