import {
  EmailSignInChallenge,
  ExternalCompletion,
  ExternalFlowStatus,
  ExternalIdentityStartResult,
  OrganizationDetail,
  SessionActor,
} from "@usepreface/protocol/dto";

import { AuthApi } from "../fixtures/api.js";
import { approveConnection, configureOidc, inviteMember } from "../fixtures/connections.js";
import { ageInvitationDelivery } from "../fixtures/invitation-delivery.js";
import {
  authenticateAtKeycloak,
  currentOrganization,
  onboardOwner,
} from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test("untrusted external email requires a browser-bound fresh code before admission", async ({
  api,
  backend,
  mailbox,
  realm,
  page,
  browser,
  infrastructure,
  database,
}) => {
  await onboardOwner(api, backend, mailbox);
  await currentOrganization(api);
  const connection = await configureOidc(api, realm, page);
  await approveConnection(api, connection, false);
  await realm.user("contractor", "contractor@outside.example.test");
  const invitation = await inviteMember(api, mailbox, "contractor@outside.example.test");
  // Model an invitation read days later: the invitation is valid, its delivery is no longer fresh proof.
  const aged = await ageInvitationDelivery(infrastructure, database, invitation.invitationId);
  expect(aged.exitCode, aged.output).toBe(0);
  const memberContext = await browser.newContext({ ignoreHTTPSErrors: true });
  const strangerContext = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const member = new AuthApi(memberContext, backend.origin, backend.dashboard);
    const stranger = new AuthApi(strangerContext, backend.origin, backend.dashboard);
    const started = await member.json(
      ExternalIdentityStartResult,
      "/invitations/authentication/start",
      "POST",
      { ...invitation, connectionId: connection.id, displayName: "Contractor" },
    );
    const memberPage = await memberContext.newPage();
    await authenticateAtKeycloak(
      memberPage,
      started.authorizationUrl,
      "contractor",
      realm.password,
      backend.dashboard,
    );
    const flowId = new URL(memberPage.url()).searchParams.get("flowId");
    expect(new URL(memberPage.url()).pathname).toBe("/auth/verify-email");
    expect(flowId).toBeTruthy();
    const path = `/auth/external/flows/${flowId}`;
    expect((await member.request("/auth/session")).status()).toBe(401);
    expect((await member.json(ExternalFlowStatus, path)).nextAction).toBe("verify_email");
    expect((await stranger.request(path)).status()).toBe(401);
    const challenge = await member.json(
      EmailSignInChallenge,
      `${path}/email/request`,
      "POST",
      {},
      202,
    );
    const code = await mailbox.code("contractor@outside.example.test");
    const wrongBrowser = await stranger.request(`${path}/email/verify`, "POST", {
      challengeId: challenge.challengeId,
      code,
    });
    expect(wrongBrowser.status()).toBe(401);
    const completed = await member.json(ExternalCompletion, `${path}/email/verify`, "POST", {
      challengeId: challenge.challengeId,
      code,
    });
    expect(completed.nextAction).toBe("continue");
    expect(new URL(completed.redirectTo).origin).toBe(backend.dashboard);
    const actor = await member.json(SessionActor, "/auth/session");
    expect((await member.json(OrganizationDetail, `/organization`)).membership.userId).toBe(
      actor.user.id,
    );
    const replay = await member.request(`${path}/email/verify`, "POST", {
      challengeId: challenge.challengeId,
      code,
    });
    expect(replay.ok()).toBe(false);
  } finally {
    await memberContext.close();
    await strangerContext.close();
  }
});
