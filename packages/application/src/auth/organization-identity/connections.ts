import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import {
  IdentityError,
  type IdentityConnectionKeyId,
  type AuthFlowIntent,
  type IdentityConnectionId,
  type OrganizationId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { ExternalIdentityStartInput } from "@usepreface/protocol/input";

import { AuthenticationLinks } from "#/auth/links";
import { makeOidcConnectionApplication, publicOidcConnection } from "#/auth/oidc/connection";
import { makeOidcFlowStart } from "#/auth/oidc/start";
import { makeConnectionHealth } from "#/auth/organization-identity/health";
import { makeSamlConnectionApplication, publicSamlConnection } from "#/auth/saml/connection";
import { makeSigningKeys } from "#/auth/saml/keys";
import { makeSamlFlowStart } from "#/auth/saml/start";
import { OrganizationAccess } from "#/organization/access";

export const makeOrganizationIdentityConnections = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const access = yield* OrganizationAccess;
  const links = yield* AuthenticationLinks;
  const oidc = yield* makeOidcConnectionApplication;
  const saml = yield* makeSamlConnectionApplication;
  const startOidc = yield* makeOidcFlowStart;
  const startSaml = yield* makeSamlFlowStart;
  const find = Effect.fn("OrganizationIdentityConnection.find")(function* (
    organizationId: OrganizationId,
    id: IdentityConnectionId,
  ) {
    const connection = yield* repository.auth.identityConnection.findByOrganizationAndId(
      organizationId,
      id,
    );
    if (connection === undefined) return yield* new IdentityError({ code: "CONNECTION_NOT_FOUND" });
    return connection;
  });
  const list = Effect.fn("Application.organization.identityConnection.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    yield* access.requireOwner(actor, organizationId);
    return {
      connections: (yield* repository.auth.identityConnection.listByOrganization(
        organizationId,
      )).map((connection) =>
        connection.provider === "saml"
          ? publicSamlConnection(connection)
          : publicOidcConnection(connection, links.publicOrigin),
      ),
    };
  });
  const get = Effect.fn("Application.organization.identityConnection.get")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
  ) {
    yield* access.requireOwner(actor, organizationId);
    const connection = yield* find(organizationId, id);
    return connection.provider === "saml"
      ? publicSamlConnection(connection)
      : publicOidcConnection(connection, links.publicOrigin);
  });
  const start = Effect.fn("Application.organization.identityConnection.start")(function* (
    intent: AuthFlowIntent,
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    input: ExternalIdentityStartInput = {},
    actor?: SessionActor,
    expectedRevision?: number,
  ) {
    const connection = yield* find(organizationId, connectionId);
    const result =
      connection.provider === "saml"
        ? yield* startSaml(intent, organizationId, connectionId, input, actor, expectedRevision)
        : yield* startOidc(intent, organizationId, connectionId, input, actor, expectedRevision);
    return { ...result, provider: connection.provider };
  });
  const change = Effect.fn("Application.organization.identityConnection.change")(function* (
    action: "activate" | "disable",
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
    revision: number,
  ) {
    const connection = yield* find(organizationId, id);
    return yield* (connection.provider === "saml" ? saml[action] : oidc[action])(
      actor,
      organizationId,
      id,
      revision,
    );
  });
  return {
    health: yield* makeConnectionHealth,
    keys: {
      ...(yield* makeSigningKeys),
      test: (
        actor: SessionActor,
        organizationId: OrganizationId,
        id: IdentityConnectionId,
        keyId: IdentityConnectionKeyId,
        revision: number,
      ) => startSaml("test", organizationId, id, {}, actor, revision, undefined, keyId),
    },
    list,
    get,
    createOidc: oidc.createOidc,
    updateOidc: oidc.updateOidc,
    refreshMetadata: oidc.refreshMetadata,
    createSaml: saml.createSaml,
    updateSaml: saml.updateSaml,
    rotateSigningKey: saml.rotateSigningKey,
    test: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      revision: number,
    ) => start("test", organizationId, id, {}, actor, revision),
    startLink: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      input: ExternalIdentityStartInput = {},
    ) => start("link", organizationId, id, input, actor),
    startReauthentication: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      input: ExternalIdentityStartInput = {},
    ) => start("reauthenticate", organizationId, id, input, actor),
    startSignIn: (
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      input: ExternalIdentityStartInput = {},
      actor?: SessionActor,
    ) => start("sign_in", organizationId, id, input, actor),
    activate: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      revision: number,
    ) => change("activate", actor, organizationId, id, revision),
    disable: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      revision: number,
    ) => change("disable", actor, organizationId, id, revision),
  };
});
