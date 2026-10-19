import assert from "node:assert/strict";

import {
  AccountList,
  AuditEventPage,
  ConnectionKeyList,
  ExternalIdentityStartResult,
  OrganizationDetail,
  PublicConnectionKey,
  SessionActor,
} from "@usepreface/protocol/dto";

import { AuthApi } from "../fixtures/api.js";
import { approveConnection, configureSaml, inviteMember } from "../fixtures/connections.js";
import {
  authenticateAtKeycloak,
  currentOrganization,
  onboardOwner,
} from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test("SAML first login survives cross-site POST, rejects assertion replay, and preserves membership through signing-key rollover", async ({
  api,
  backend,
  mailbox,
  realm,
  page,
  browser,
}) => {
  await onboardOwner(api, backend, mailbox);
  await currentOrganization(api);
  const { connection, client } = await configureSaml(api, realm, page);
  await approveConnection(api, connection);
  await realm.user("alice", "alice@company.example.test");
  const invitation = await inviteMember(api, mailbox, "alice@company.example.test");
  const memberContext = await browser.newContext({ ignoreHTTPSErrors: true });
  const replayContext = await browser.newContext({ ignoreHTTPSErrors: true });
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
    const posted = memberPage.waitForRequest(
      (request) =>
        request.url().endsWith(`/auth/saml/${connection.id}/acs`) && request.method() === "POST",
    );
    await authenticateAtKeycloak(
      memberPage,
      started.authorizationUrl,
      "alice",
      realm.password,
      backend.dashboard,
    );
    const assertionRequest = await posted;
    // 127.0.0.1 IdP -> localhost SP is cross-site. Lax proof returns on the following GET.
    expect((await assertionRequest.allHeaders()).cookie ?? "").not.toContain("preface_saml_flow");
    const actor = await member.json(SessionActor, "/auth/session");
    expect((await member.json(OrganizationDetail, `/organization`)).membership.userId).toBe(
      actor.user.id,
    );
    expect((await member.json(AccountList, "/users/me/accounts")).accounts).toHaveLength(1);
    const replay = await replayContext.request.post(assertionRequest.url(), {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: assertionRequest.postData() ?? "",
      maxRedirects: 0,
    });
    expect(replay.status()).toBe(303);
    expect(new URL(replay.headers().location ?? "").pathname).toBe("/auth/error");
    expect(
      (
        await new AuthApi(replayContext, backend.origin, backend.dashboard).request("/auth/session")
      ).status(),
    ).toBe(401);

    const path = `/organization/identity-connections/${connection.id}`;
    const candidate = await api.json(PublicConnectionKey, `${path}/saml/keys`, "POST", {
      expectedRevision: connection.revision,
    });
    const overlap = await api.request(`${path}/saml/metadata`);
    expect((await overlap.text()).match(/<ds:X509Certificate>/g)).toHaveLength(2);
    await client.importSigningCertificate(candidate.certificate);
    const testing = await api.json(
      ExternalIdentityStartResult,
      `${path}/saml/keys/${candidate.id}/test`,
      "POST",
      { expectedRevision: connection.revision },
    );
    await authenticateAtKeycloak(
      page,
      testing.authorizationUrl,
      "operator",
      realm.password,
      backend.dashboard,
    );
    await api.json(PublicConnectionKey, `${path}/saml/keys/${candidate.id}/activate`, "POST", {
      expectedRevision: connection.revision,
    });
    expect((await member.json(OrganizationDetail, `/organization`)).membership.userId).toBe(
      actor.user.id,
    );
    const keys = await api.json(ConnectionKeyList, `${path}/saml/keys`);
    const retiring = keys.keys.find((key) => key.status === "retiring");
    assert.ok(retiring, "Previous signing key is retiring");
    await api.json(PublicConnectionKey, `${path}/saml/keys/${retiring.id}/retire`, "POST", {
      expectedRevision: connection.revision,
    });
    const metadata = await api.request(`${path}/saml/metadata`);
    expect((await metadata.text()).match(/<ds:X509Certificate>/g)).toHaveLength(1);
    const audit = await api.json(AuditEventPage, `/organization/audit-events`);
    expect(audit.events.some((event) => event.eventType.includes("key"))).toBe(true);
    expect(JSON.stringify(audit)).not.toContain(invitation.token);
    expect(JSON.stringify(audit)).not.toContain("PRIVATE KEY");
    // The SP-bound tile starts a new request; it does not accept an unsolicited assertion.
    expect((await member.request("/auth/session", "DELETE")).status()).toBe(204);
    await memberPage.goto(
      `${backend.origin}/api/v1${path}/saml/login?returnPath=${encodeURIComponent("/")}`,
    );
    await memberPage.waitForURL(`${backend.dashboard}/`);
    expect((await member.json(SessionActor, "/auth/session")).user.id).toBe(actor.user.id);
  } finally {
    await memberContext.close();
    await replayContext.close();
  }
});
