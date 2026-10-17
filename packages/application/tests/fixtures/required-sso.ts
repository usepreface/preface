import { Effect } from "effect";

import type { IdentityConnectionId, OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { Application } from "../../src/index.js";
import { configureTestOidc, linkTestOidc, oidcCallbackInput } from "./oidc.js";
import { createTestOrganization } from "./organization.js";

export const enableTestSso = Effect.fnUntraced(function* (
  actor: SessionActor,
  organizationId: OrganizationId,
  connectionId: IdentityConnectionId,
  ssoMaxAgeSeconds = 43200,
) {
  const application = yield* Application;
  const started = yield* application.auth.oidc.startReauthentication(
    actor,
    organizationId,
    connectionId,
  );
  yield* application.auth.oidc.callback(yield* oidcCallbackInput(started), actor);
  const recovery = yield* application.organization.authRecovery.rotate(actor, organizationId);
  const current = yield* application.organization.authPolicy.get(actor, organizationId);
  const policy = yield* application.organization.authPolicy.update(actor, organizationId, {
    expectedRevision: current.revision,
    ssoMode: "required",
    ssoMaxAgeSeconds,
    recoveryCredential: recovery.recoveryCredential,
  });
  return { recovery, policy };
});

export const createRequiredSsoOrganization = Effect.gen(function* () {
  const fixture = yield* createTestOrganization;
  const connection = yield* configureTestOidc(fixture.owner.actor, fixture.organization.id);
  const account = yield* linkTestOidc(fixture.owner.actor, fixture.organization.id, connection.id);
  const enforced = yield* enableTestSso(
    fixture.owner.actor,
    fixture.organization.id,
    connection.id,
  );
  return { ...fixture, connection, account, ...enforced };
});
