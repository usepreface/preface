import { Effect, Redacted, Ref, Schema } from "effect";

import type { IdentityConnectionId, OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { CreateOidcConnectionInput, GoogleCallbackInput } from "@usepreface/protocol/input";

import { Application } from "../../src/index.js";
import { TestOidc } from "./oidc-provider.js";

export const oidcCallbackInput = (started: {
  readonly authorizationUrl: string;
  readonly browserToken: Redacted.Redacted<string>;
}) =>
  Schema.decodeUnknownEffect(GoogleCallbackInput)({
    state: new URL(started.authorizationUrl).searchParams.get("state"),
    browserToken: Redacted.value(started.browserToken),
    code: "test-authorization-code",
  });

export const configureTestOidc = Effect.fnUntraced(function* (
  actor: SessionActor,
  organizationId: OrganizationId,
) {
  const provider = yield* TestOidc;
  yield* Ref.set(provider.gate, Effect.void);
  yield* Ref.set(provider.identity, {
    issuer: "https://identity.example.test",
    subject: "operator-oidc",
    email: "claim@example.test",
    emailVerified: true,
  });
  const application = yield* Application;
  const connection = yield* application.organization.identityConnection.createOidc(
    actor,
    organizationId,
    yield* Schema.decodeUnknownEffect(CreateOidcConnectionInput)({
      name: "Company",
      issuer: "https://identity.example.test",
      clientId: "preface-client",
      clientAuthenticationMethod: "client_secret_basic",
      clientSecret: "fixture-client-secret",
    }),
  );
  const started = yield* application.organization.identityConnection.test(
    actor,
    organizationId,
    connection.id,
    connection.revision,
  );
  yield* application.auth.oidc.callback(yield* oidcCallbackInput(started), actor);
  const active = yield* application.organization.identityConnection.activate(
    actor,
    organizationId,
    connection.id,
    connection.revision,
  );
  const policy = yield* application.organization.authPolicy.get(actor, organizationId);
  yield* application.organization.authPolicy.update(actor, organizationId, {
    expectedRevision: policy.revision,
    oidcConnectionIds: [active.id],
  });
  return active;
});
export const linkTestOidc = Effect.fnUntraced(function* (
  actor: SessionActor,
  organizationId: OrganizationId,
  connectionId: IdentityConnectionId,
) {
  const application = yield* Application;
  const started = yield* application.auth.oidc.startLink(actor, organizationId, connectionId);
  yield* application.auth.oidc.callback(yield* oidcCallbackInput(started), actor);
  const account = (yield* application.auth.account.list(actor)).accounts.find(
    (entry) => entry.connectionId === connectionId && entry.unlinkedAt === null,
  );
  if (account === undefined) throw new Error("Expected linked OIDC account");
  return account;
});
export const signInTestOidc = Effect.fnUntraced(function* (
  organizationId: OrganizationId,
  connectionId: IdentityConnectionId,
) {
  const application = yield* Application;
  const started = yield* application.auth.oidc.startSignIn(organizationId, connectionId);
  const completed = yield* application.auth.oidc.callback(yield* oidcCallbackInput(started));
  if (completed.sessionToken === undefined) throw new Error("Expected OIDC session credential");
  return {
    token: completed.sessionToken,
    actor: yield* application.auth.session.resolve(completed.sessionToken),
  };
});
