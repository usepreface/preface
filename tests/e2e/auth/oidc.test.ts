import {
  AccountList,
  ExternalIdentityStartResult,
  OrganizationDetail,
  PublicTeam,
  TeamMemberList,
  SessionActor,
  InvitationAcceptance,
  EmailSignInChallenge,
} from "@usepreface/protocol/dto";

import { AuthApi } from "../fixtures/api.js";
import { approveConnection, configureOidc, inviteMember } from "../fixtures/connections.js";
import {
  authenticateAtKeycloak,
  currentOrganization,
  onboardOwner,
} from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test("invited employee joins directly through OIDC with role and team assignments", async ({
  api,
  backend,
  mailbox,
  realm,
  page,
  browser,
}) => {
  await onboardOwner(api, backend, mailbox);
  await currentOrganization(api);
  const connection = await configureOidc(api, realm, page);
  await approveConnection(api, connection);
  const team = await api.json(
    PublicTeam,
    `/organization/teams`,
    "POST",
    { slug: "engineering", metadata: { name: "Engineering" } },
    201,
  );
  await realm.user("alice", "alice@company.example.test");
  const invitation = await inviteMember(api, mailbox, "alice@company.example.test", [
    { teamId: team.id },
  ]);
  const memberContext = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const member = new AuthApi(memberContext, backend.origin, backend.dashboard);
    const started = await member.json(
      ExternalIdentityStartResult,
      "/invitations/authentication/start",
      "POST",
      {
        ...invitation,
        connectionId: connection.id,
        displayName: "Alice",
        returnPath: "/",
      },
    );
    const memberPage = await memberContext.newPage();
    await authenticateAtKeycloak(
      memberPage,
      started.authorizationUrl,
      "alice",
      realm.password,
      backend.dashboard,
    );
    expect(memberPage.url()).toBe(`${backend.dashboard}/`);
    const actor = await member.json(SessionActor, "/auth/session");
    const access = await member.json(OrganizationDetail, `/organization`);
    expect(access.membership.userId).toBe(actor.user.id);
    expect(access.access.isOwner).toBe(false);
    expect(access.membership.roles.map((role) => role.key)).toContain("member");
    const members = await api.json(TeamMemberList, `/organization/teams/${team.id}/members`);
    expect(members.members.some((entry) => entry.userId === actor.user.id)).toBe(true);
    const accounts = await member.json(AccountList, "/users/me/accounts");
    expect(accounts.accounts).toHaveLength(1);
    const denied = await member.request("/organization", "POST", {
      slug: "forbidden",
      metadata: { name: "Forbidden" },
    });
    expect(denied.status()).toBe(404);
    const replay = await member.request("/invitations/authentication/start", "POST", {
      ...invitation,
      connectionId: connection.id,
      displayName: "Alice",
    });
    expect(replay.ok()).toBe(false);
  } finally {
    await memberContext.close();
  }
});

test("email-first member is implicitly linked to the same identity on first OIDC sign-in", async ({
  api,
  backend,
  mailbox,
  realm,
  page,
  browser,
}) => {
  await onboardOwner(api, backend, mailbox);
  await currentOrganization(api);
  const connection = await configureOidc(api, realm, page);
  await approveConnection(api, connection);
  await realm.user("alice", "alice@company.example.test");
  const invitation = await inviteMember(api, mailbox, "alice@company.example.test");
  const memberContext = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const member = new AuthApi(memberContext, backend.origin, backend.dashboard);
    const challenge = await member.json(
      EmailSignInChallenge,
      "/invitations/verification/request",
      "POST",
      invitation,
      202,
    );
    const accepted = await member.json(
      InvitationAcceptance,
      "/invitations/accept",
      "POST",
      {
        ...invitation,
        challengeId: challenge.challengeId,
        method: "code",
        code: await mailbox.code("alice@company.example.test"),
        displayName: "Alice",
      },
      201,
    );
    const path = `/organization/identity-connections/${connection.id}`;
    expect((await member.request("/auth/session", "DELETE")).status()).toBe(204);
    const started = await member.json(
      ExternalIdentityStartResult,
      `${path}/sign-in/start`,
      "POST",
      {},
    );
    const memberPage = await memberContext.newPage();
    await authenticateAtKeycloak(
      memberPage,
      started.authorizationUrl,
      "alice",
      realm.password,
      backend.dashboard,
    );
    expect((await member.json(SessionActor, "/auth/session")).user.id).toBe(accepted.actor.user.id);
    expect((await member.json(AccountList, "/users/me/accounts")).accounts).toHaveLength(1);
    expect((await member.request("/auth/session", "DELETE")).status()).toBe(204);
    const returning = await member.json(
      ExternalIdentityStartResult,
      `${path}/sign-in/start`,
      "POST",
      {},
    );
    await memberPage.goto(returning.authorizationUrl);
    await memberPage.waitForURL((url) => url.origin === backend.dashboard);
    expect(new URL(memberPage.url()).pathname).not.toBe("/auth/error");
    expect((await member.json(SessionActor, "/auth/session")).user.id).toBe(accepted.actor.user.id);
  } finally {
    await memberContext.close();
  }
});
