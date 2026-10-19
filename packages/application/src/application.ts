import { Context, Effect, Layer } from "effect";

import { DatabaseMigration } from "@usepreface/database";
import type { IdentityConnectionId, OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { GoogleStartInput } from "@usepreface/protocol/input";

import { makeAuditHistory } from "#/audit/history";
import { makeAccountApplication } from "#/auth/account";
import { makeAuthenticationDiscovery } from "#/auth/discovery";
import { makeEmailSignInApplication } from "#/auth/email-sign-in";
import { makeExternalContinuation } from "#/auth/external/continuation";
import { makeInvitationAuthentication } from "#/auth/external/invitation";
import { makeGoogleFlowCallback } from "#/auth/google/callback";
import { makeGoogleConnectionApplication } from "#/auth/google/connection";
import { makeGoogleFlowStart } from "#/auth/google/start";
import { makeOidcFlowCallback } from "#/auth/oidc/callback";
import { makeOidcFlowStart } from "#/auth/oidc/start";
import { makeOrganizationIdentityConnections } from "#/auth/organization-identity/connections";
import { makeConnectionMaintenance } from "#/auth/organization-identity/maintenance";
import { makeSamlFlowCallback } from "#/auth/saml/callback";
import { makeSamlConnectionApplication } from "#/auth/saml/connection";
import { makeSamlFlowStart } from "#/auth/saml/start";
import { makeSessionApplication } from "#/auth/session";
import { makeBootstrapApplication } from "#/instance/bootstrap";
import { OrganizationAccess } from "#/organization/access";
import { makeDomainApplication } from "#/organization/domain/application";
import { makeOrganizationsApplication } from "#/organization/index";
import { TeamAccess } from "#/organization/team/access";
import { makeProfileApplication } from "#/profile/user";

const makeApplication = Effect.gen(function* () {
  yield* DatabaseMigration;
  const organizations = yield* makeOrganizationsApplication;
  const bootstrap = yield* makeBootstrapApplication;
  const emailSignIn = yield* makeEmailSignInApplication;
  const session = yield* makeSessionApplication;

  const start = yield* makeGoogleFlowStart;
  const connections = yield* makeGoogleConnectionApplication;
  const startOidc = yield* makeOidcFlowStart;
  const organizationConnections = yield* makeOrganizationIdentityConnections;
  const samlConnections = yield* makeSamlConnectionApplication;
  const startSaml = yield* makeSamlFlowStart;
  const samlCallback = yield* makeSamlFlowCallback;
  const discover = yield* makeAuthenticationDiscovery;
  return {
    audit: yield* makeAuditHistory,
    instance: {
      bootstrap,
      capabilities: organizations.capabilities,
      authentication: {
        google: {
          ...connections,
          test: (actor: SessionActor, expectedRevision: number) =>
            start("test", actor, {}, expectedRevision),
        },
      },
    },
    auth: {
      connectionMaintenance: yield* makeConnectionMaintenance,
      discover,
      external: {
        ...(yield* makeExternalContinuation),
        invitation: yield* makeInvitationAuthentication,
      },
      session,
      emailSignIn,
      profile: yield* makeProfileApplication,
      account: {
        ...(yield* makeAccountApplication),
        startGoogle: (actor: SessionActor, input: GoogleStartInput = {}) =>
          start("link", actor, input),
      },
      saml: {
        ...samlCallback,
        metadata: samlConnections.metadata,
        startSignIn: (
          organizationId: OrganizationId,
          id: IdentityConnectionId,
          input: GoogleStartInput = {},
          actor?: SessionActor,
        ) => startSaml("sign_in", organizationId, id, input, actor),
        startLink: (
          actor: SessionActor,
          organizationId: OrganizationId,
          id: IdentityConnectionId,
          input: GoogleStartInput = {},
        ) => startSaml("link", organizationId, id, input, actor),
        startReauthentication: (
          actor: SessionActor,
          organizationId: OrganizationId,
          id: IdentityConnectionId,
          input: GoogleStartInput = {},
        ) => startSaml("reauthenticate", organizationId, id, input, actor),
      },
      oidc: {
        startSignIn: (
          organizationId: OrganizationId,
          connectionId: IdentityConnectionId,
          input: GoogleStartInput = {},
          actor?: SessionActor,
        ) => startOidc("sign_in", organizationId, connectionId, input, actor),
        startLink: (
          actor: SessionActor,
          organizationId: OrganizationId,
          connectionId: IdentityConnectionId,
          input: GoogleStartInput = {},
        ) => startOidc("link", organizationId, connectionId, input, actor),
        startReauthentication: (
          actor: SessionActor,
          organizationId: OrganizationId,
          connectionId: IdentityConnectionId,
          input: GoogleStartInput = {},
        ) => startOidc("reauthenticate", organizationId, connectionId, input, actor),
        callback: yield* makeOidcFlowCallback,
      },
      google: {
        start: (input: GoogleStartInput = {}, actor?: SessionActor) =>
          start("sign_in", actor, input),
        callback: yield* makeGoogleFlowCallback,
      },
      methods: Effect.fn("Application.auth.methods")(function* () {
        const methods = yield* discover();
        return { email: true as const, google: methods.google };
      }),
    },
    organization: {
      ...organizations.organization,
      domain: yield* makeDomainApplication,
      identityConnection: organizationConnections,
    },
  } as const;
});

export class Application extends Context.Service<
  Application,
  Effect.Success<typeof makeApplication>
>()("@usepreface/application/Application") {
  static readonly layer = Layer.effect(Application, makeApplication).pipe(
    Layer.provide(TeamAccess.layer.pipe(Layer.provideMerge(OrganizationAccess.layer))),
  );
}
