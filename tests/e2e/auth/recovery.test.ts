import {
  ExternalIdentityStartResult,
  OrganizationAuthRecoveryIssued,
  PublicOrganizationAuthPolicy,
  OrganizationDetail,
  PublicOidcConnection,
  AuditEventPage,
} from "@usepreface/protocol/dto";

import { approveConnection, configureOidc } from "../fixtures/connections.js";
import {
  authenticateAtKeycloak,
  createOrganization,
  onboardOwner,
  signInWithEmail,
} from "../fixtures/onboarding.js";
import { test, expect } from "../fixtures/test.js";

test("required SSO gates email-only sessions and an offline owner credential recovers without the IdP", async ({
  api,
  backend,
  mailbox,
  realm,
  page,
}) => {
  const owner = await onboardOwner(api, backend, mailbox);
  const { organization } = await createOrganization(api);
  const connection = await configureOidc(api, realm, page, organization.id);
  await approveConnection(api, organization.id, connection);
  const path = `/organizations/${organization.id}`;
  const connectionPath = `${path}/identity-connections/${connection.id}`;
  const link = await api.json(
    ExternalIdentityStartResult,
    `${connectionPath}/link/start`,
    "POST",
    {},
  );
  await authenticateAtKeycloak(
    page,
    link.authorizationUrl,
    "operator",
    realm.password,
    backend.dashboard,
  );
  const reauthentication = await api.json(
    ExternalIdentityStartResult,
    `${connectionPath}/reauthenticate/start`,
    "POST",
    {},
  );
  await authenticateAtKeycloak(
    page,
    reauthentication.authorizationUrl,
    "operator",
    realm.password,
    backend.dashboard,
  );
  const recovery = await api.json(
    OrganizationAuthRecoveryIssued,
    `${path}/auth-recovery/rotate`,
    "POST",
    {},
  );
  const policy = await api.json(PublicOrganizationAuthPolicy, `${path}/auth-policy`);
  const required = await api.json(PublicOrganizationAuthPolicy, `${path}/auth-policy`, "PATCH", {
    expectedRevision: policy.revision,
    ssoMode: "required",
    recoveryCredential: recovery.recoveryCredential,
  });
  expect((await api.json(OrganizationDetail, path)).access.isOwner).toBe(true);
  expect((await api.request("/auth/session", "DELETE")).status()).toBe(204);
  expect((await signInWithEmail(api, mailbox, owner.email)).user.id).toBe(owner.actor.user.id);
  const gated = await api.request(path);
  expect(gated.status()).toBe(403);
  expect(await gated.json()).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
  await realm.disableSignIn(reauthentication.authorizationUrl);
  const recovered = await api.json(
    PublicOrganizationAuthPolicy,
    `${path}/auth-recovery/recover`,
    "POST",
    { expectedRevision: required.revision, recoveryCredential: recovery.recoveryCredential },
  );
  expect(recovered.ssoMode).toBe("optional");
  const disabled = await api.json(PublicOidcConnection, `${connectionPath}/disable`, "POST", {
    expectedRevision: connection.revision,
  });
  expect(disabled.status).toBe("disabled");
  expect((await api.json(OrganizationDetail, path)).access.isOwner).toBe(true);
  const reused = await api.request(`${path}/auth-recovery/recover`, "POST", {
    expectedRevision: recovered.revision,
    recoveryCredential: recovery.recoveryCredential,
  });
  expect(reused.status()).toBe(401);
  expect(await reused.json()).toMatchObject({ code: "INVALID_RECOVERY_CREDENTIAL" });
  const audit = await api.json(AuditEventPage, `${path}/audit-events`);
  expect(audit.events.some((event) => event.eventType === "organization.auth_recovered")).toBe(
    true,
  );
  expect(JSON.stringify(audit)).not.toContain(recovery.recoveryCredential);
});
