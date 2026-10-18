import { ExternalIdentityStartResult, PublicOidcConnection } from "@usepreface/protocol/dto";

import { AuthApi } from "../fixtures/api.js";
import { approveConnection, configureOidc, inviteMember } from "../fixtures/connections.js";
import { createOrganization, onboardOwner } from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test("revocation during an OIDC round trip prevents invitation admission", async ({
  api,
  backend,
  mailbox,
  realm,
  page,
  browser,
}) => {
  await onboardOwner(api, backend, mailbox);
  const { organization } = await createOrganization(api);
  const connection = await configureOidc(api, realm, page, organization.id);
  await approveConnection(api, organization.id, connection);
  await realm.user("alice", "alice@company.example.test");
  const invitation = await inviteMember(
    api,
    mailbox,
    organization.id,
    "alice@company.example.test",
  );
  const memberContext = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const member = new AuthApi(memberContext, backend.origin, backend.dashboard);
    const started = await member.json(
      ExternalIdentityStartResult,
      "/invitations/authentication/start",
      "POST",
      { ...invitation, connectionId: connection.id, displayName: "Alice" },
    );
    const memberPage = await memberContext.newPage();
    await memberPage.goto(started.authorizationUrl);
    await memberPage.getByLabel("Username or email").fill("alice");
    await memberPage.getByLabel("Password", { exact: true }).fill(realm.password);
    expect(
      (
        await api.request(
          `/organizations/${organization.id}/invitations/${invitation.invitationId}`,
          "DELETE",
        )
      ).status(),
    ).toBe(204);
    await memberPage.getByRole("button", { name: "Sign In", exact: true }).click();
    await memberPage.waitForURL((url) => url.origin === backend.dashboard);
    expect(new URL(memberPage.url()).pathname).toBe("/auth/error");
    expect((await member.request("/auth/session")).status()).toBe(401);
    const disabled = await api.json(
      PublicOidcConnection,
      `/organizations/${organization.id}/identity-connections/${connection.id}/disable`,
      "POST",
      { expectedRevision: connection.revision },
    );
    expect(disabled.status).toBe("disabled");
    const denied = await member.request(
      `/organizations/${organization.id}/identity-connections/${connection.id}/sign-in/start`,
      "POST",
      {},
    );
    expect(denied.status()).toBe(409);
    expect(await denied.json()).toMatchObject({ code: "CONNECTION_UNAVAILABLE" });
  } finally {
    await memberContext.close();
  }
});
