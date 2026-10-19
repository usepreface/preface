import assert from "node:assert/strict";

import { Schema } from "effect";

import {
  BootstrapVerification,
  EmailSignInChallenge,
  OrganizationDetail,
  SessionActor,
} from "@usepreface/protocol/dto";

import { AuthApi } from "../fixtures/api.js";
import { onboardOwner, signInWithEmail } from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test("operator installs the organization, signs back into it, and logs out", async ({
  page,
  context,
  api,
  backend,
  mailbox,
}) => {
  await page.goto(`${backend.dashboard}/setup#token=${backend.token}`);
  const requested = await page.evaluate(
    async ({ url, token }) => {
      const response = await fetch(`${url}/api/v1/instance/setup`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          organizationName: "Fixture",
          ownerName: "Operator",
          email: "owner@company.example.test",
        }),
      });
      return { status: response.status, body: await response.json() };
    },
    { url: backend.origin, token: backend.token },
  );
  expect(requested.status).toBe(202);
  const challenge = Schema.decodeUnknownSync(Schema.toEncoded(BootstrapVerification))(
    requested.body,
  );
  const code = await mailbox.code("owner@company.example.test");
  const incorrect = await api.request("/instance/setup/verify", "POST", {
    token: backend.token,
    challengeId: challenge.challengeId,
    code: code === "00000000" ? "11111111" : "00000000",
  });
  expect(incorrect.status()).toBe(401);
  expect(await incorrect.json()).toMatchObject({ code: "INVALID_CODE" });
  expect((await api.request("/auth/session")).status()).toBe(401);

  const actor = await api.json(
    SessionActor,
    "/instance/setup/verify",
    "POST",
    { token: backend.token, challengeId: challenge.challengeId, code },
    201,
  );
  const cookie = (await context.cookies(backend.origin)).find(
    (value) => value.name === "preface_session",
  );
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("preface_session");
  const replay = await api.request("/instance/setup/verify", "POST", {
    token: backend.token,
    challengeId: challenge.challengeId,
    code,
  });
  expect(replay.status()).toBe(409);
  expect((await api.request("/auth/session", "DELETE")).status()).toBe(204);
  expect((await api.request("/auth/session")).status()).toBe(401);

  const returning = await signInWithEmail(api, mailbox, "owner@company.example.test");
  expect(returning.user.id).toBe(actor.user.id);
  const persisted = await api.json(OrganizationDetail, `/organization`);
  expect(persisted.access.isOwner).toBe(true);
  expect(persisted.organization.metadata.name).toBe("Fixture");
  const browserRead = await page.evaluate(async (url) => {
    const response = await fetch(`${url}/api/v1/auth/session`, { credentials: "include" });
    return { status: response.status, body: await response.json() };
  }, backend.origin);
  expect(browserRead.status).toBe(200);
  expect(browserRead.body.user.id).toBe(actor.user.id);
  expect((await api.request("/auth/sessions", "DELETE")).status()).toBe(204);
  expect((await api.request("/auth/session")).status()).toBe(401);
});

test("magic link is bound to its requesting browser and consumed once", async ({
  api,
  backend,
  mailbox,
  browser,
  page,
}) => {
  const owner = await onboardOwner(api, backend, mailbox);
  expect((await api.request("/auth/session", "DELETE")).status()).toBe(204);
  const challenge = await api.json(
    EmailSignInChallenge,
    "/auth/email/request",
    "POST",
    { email: owner.email },
    202,
  );
  const browserProof = (await api.context.cookies(backend.origin)).find(
    (cookie) => cookie.name === "preface_sign_in",
  );
  assert.ok(browserProof, "Requesting browser has a sign-in proof");
  const link = await mailbox.signInLink(owner.email);
  const parameters = new URLSearchParams(link.hash.slice(1));
  expect(parameters.get("challengeId")).toBe(challenge.challengeId);
  const payload = {
    challengeId: challenge.challengeId,
    method: "magic_link",
    token: parameters.get("token"),
  };
  const strangerContext = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const stranger = new AuthApi(strangerContext, backend.origin, backend.dashboard);
    const wrongBrowser = await stranger.request("/auth/email/verify", "POST", payload);
    expect(wrongBrowser.status()).toBe(401);
    expect((await stranger.request("/auth/session")).status()).toBe(401);
    await page.goto(link.href);
    const actor = await api.json(SessionActor, "/auth/email/verify", "POST", payload, 201);
    expect(actor.user.id).toBe(owner.actor.user.id);
    expect((await api.request("/auth/session", "DELETE")).status()).toBe(204);
    await api.context.addCookies([browserProof]);
    const replay = await api.request("/auth/email/verify", "POST", payload);
    expect(replay.status()).toBe(401);
    expect(await replay.json()).toMatchObject({ code: "INVALID_PROOF" });
  } finally {
    await strangerContext.close();
  }
});
