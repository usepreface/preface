import { Effect, Redacted, Ref } from "effect";

import type { IdentityConnectionId, OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { Application } from "../../src/index.js";
import { TestSaml } from "./saml-provider.js";

export const samlCallbackInput = (started: { readonly authorizationUrl: string }) => {
  const relayState = new URL(started.authorizationUrl).searchParams.get("RelayState");
  if (relayState === null) throw new Error("Expected SAML relay state");
  return {
    relayState: Redacted.make(relayState),
    response: Redacted.make("fixture-response-validated-at-provider-boundary"),
  };
};

export const completeTestSaml = Effect.fnUntraced(function* (
  connectionId: IdentityConnectionId,
  started: { readonly authorizationUrl: string; readonly browserToken: Redacted.Redacted<string> },
  actor?: SessionActor,
) {
  const application = yield* Application;
  const staged = yield* application.auth.saml.callback(connectionId, samlCallbackInput(started));
  return yield* application.auth.saml.complete(
    { ...staged, browserToken: started.browserToken },
    actor,
  );
});

export const configureTestSaml = Effect.fnUntraced(function* (
  actor: SessionActor,
  organizationId: OrganizationId,
) {
  const provider = yield* TestSaml;
  yield* Ref.set(provider.gate, Effect.void);
  yield* Ref.set(provider.identity, {
    issuer: "https://saml.example.test",
    subject: "immutable-employee-42",
  });
  const application = yield* Application;
  const draft = yield* application.organization.identityConnection.createSaml(
    actor,
    organizationId,
    { name: "Company SAML" },
  );
  const connection = yield* application.organization.identityConnection.updateSaml(
    actor,
    organizationId,
    draft.id,
    {
      expectedRevision: draft.revision,
      idp: {
        entityId: "https://saml.example.test",
        signOnUrl: "https://saml.example.test/login",
        signingCertificates: ["provider-boundary-fixture-certificate"],
        nameIdFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
      },
    },
  );
  const started = yield* application.organization.identityConnection.test(
    actor,
    organizationId,
    connection.id,
    connection.revision,
  );
  yield* completeTestSaml(connection.id, started, actor);
  const active = yield* application.organization.identityConnection.activate(
    actor,
    organizationId,
    connection.id,
    connection.revision,
  );
  if (active.provider !== "saml") throw new Error("Expected SAML connection");
  const policy = yield* application.organization.authPolicy.get(actor, organizationId);
  yield* application.organization.authPolicy.update(actor, organizationId, {
    expectedRevision: policy.revision,
    samlConnectionIds: [active.id],
  });
  return active;
});

export const linkTestSaml = Effect.fnUntraced(function* (
  actor: SessionActor,
  organizationId: OrganizationId,
  connectionId: IdentityConnectionId,
) {
  const application = yield* Application;
  const started = yield* application.auth.saml.startLink(actor, organizationId, connectionId);
  return yield* completeTestSaml(connectionId, started, actor);
});
