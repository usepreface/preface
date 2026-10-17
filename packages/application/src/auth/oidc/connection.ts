import { DateTime, Effect, Schema } from "effect";

import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { IdentityConnectionId, IdentityError, type OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { CreateOidcConnectionInput, UpdateOidcConnectionInput } from "@usepreface/protocol/input";
import type { OidcConnection } from "@usepreface/protocol/model";

import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { AuthenticationLinks } from "#/auth/links";
import { makeOidcAccess } from "#/auth/oidc/access";
import { OidcIdentity } from "#/auth/oidc/provider";
import { OrganizationAccess } from "#/organization/access";
import { makeOrganizationOwnerPaths } from "#/organization/authentication/owner-paths";

export const makeOidcConnectionApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const ownerPaths = yield* makeOrganizationOwnerPaths;
  const transaction = yield* TransactionService;
  const access = yield* makeOidcAccess;
  const identities = yield* makeIdentityAccess;
  const organizations = yield* OrganizationAccess;
  const secrets = yield* makeIdentitySecrets;
  const provider = yield* OidcIdentity;
  const links = yield* AuthenticationLinks;
  const view = (connection: OidcConnection) => ({
    id: connection.id,
    organizationId: connection.organizationId,
    provider: connection.provider,
    name: connection.name,
    status: connection.status,
    revision: connection.revision,
    configuration: connection.configuration,
    hasClientSecret: true,
    callbackUrl: new URL("/api/v1/auth/oidc/callback", links.publicOrigin).href,
    testedRevision: connection.testedRevision,
    testedAt: connection.testedAt,
    activatedAt: connection.activatedAt,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  });
  const requireOwner = Effect.fn("OidcConnection.requireOwner")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    lock = false,
  ) {
    const resolved = yield* organizations.requireOwner(actor, organizationId, { lock });
    yield* identities.requireRecentEmail(actor);
    return resolved;
  });
  const list = Effect.fn("Application.organization.identityConnection.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    yield* organizations.requireOwner(actor, organizationId);
    return {
      connections: (yield* repository.auth.identityConnection.listByOrganization(
        organizationId,
      )).map(view),
    };
  });
  const get = Effect.fn("Application.organization.identityConnection.get")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
  ) {
    yield* organizations.requireOwner(actor, organizationId);
    return view(yield* access.requireConnection(organizationId, id));
  });
  const createOidc = Effect.fn("Application.organization.identityConnection.createOidc")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: CreateOidcConnectionInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CreateOidcConnectionInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    yield* requireOwner(actor, organizationId);
    const configuration = yield* provider.discover(decoded);
    const id = Schema.decodeSync(IdentityConnectionId)(generateUuid7());
    const ciphertext = yield* secrets.encryptConnection(id, 1, decoded.clientSecret);
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* requireOwner(actor, organizationId, true);
        const now = yield* DateTime.now;
        const connection = yield* repository.auth.identityConnection.createOidc({
          id,
          installationId: null,
          organizationId,
          provider: "oidc",
          name: decoded.name,
          status: "draft",
          revision: 1,
          configuration,
          secretsCiphertext: ciphertext,
          activatedAt: null,
          testedRevision: null,
          testedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "auth.connection_configured",
          targetType: "identity_connection",
          targetId: id,
          metadata: { revision: 1 },
        });
        return view(connection);
      }),
    );
  });
  const save = Effect.fn("Application.organization.identityConnection.updateOidc")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
    input: UpdateOidcConnectionInput,
    refreshMetadata = false,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(UpdateOidcConnectionInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    if (!refreshMetadata && Object.keys(decoded).length < 2)
      return yield* new IdentityError({ code: "INVALID_INPUT" });
    yield* requireOwner(actor, organizationId);
    const previous = yield* access.requireConnection(organizationId, id);
    if (previous.revision !== decoded.expectedRevision)
      return yield* new IdentityError({ code: "REVISION_CONFLICT" });
    const issuer = decoded.issuer ?? previous.configuration.issuer;
    const clientId = decoded.clientId ?? previous.configuration.clientId;
    if (
      previous.activatedAt !== null &&
      (issuer !== previous.configuration.issuer || clientId !== previous.configuration.clientId)
    )
      return yield* new IdentityError({ code: "IDENTITY_CONFIGURATION_IMMUTABLE" });
    const changesTrust =
      refreshMetadata ||
      decoded.issuer !== undefined ||
      decoded.clientId !== undefined ||
      decoded.clientSecret !== undefined ||
      decoded.clientAuthenticationMethod !== undefined;
    const configuration = changesTrust
      ? yield* provider.discover({
          issuer,
          clientId,
          clientAuthenticationMethod:
            decoded.clientAuthenticationMethod ?? previous.configuration.clientAuthenticationMethod,
        })
      : previous.configuration;
    const revision = previous.revision + (changesTrust ? 1 : 0);
    const ciphertext = changesTrust
      ? yield* secrets.encryptConnection(
          id,
          revision,
          decoded.clientSecret ?? (yield* secrets.decryptConnection(previous)),
        )
      : previous.secretsCiphertext;
    return yield* transaction.run(
      Effect.gen(function* () {
        const current = yield* access.requireConnection(organizationId, id, true);
        yield* requireOwner(actor, organizationId, true);
        if (
          current.revision !== previous.revision ||
          (current.activatedAt === null) !== (previous.activatedAt === null)
        )
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        const next = {
          ...current,
          name: decoded.name ?? current.name,
          configuration,
          revision,
          secretsCiphertext: ciphertext,
          updatedAt: yield* DateTime.now,
          ...(changesTrust
            ? { status: "draft" as const, testedAt: null, testedRevision: null }
            : {}),
        };
        yield* repository.auth.identityConnection.update(next, current.revision);
        if (changesTrust) {
          yield* ownerPaths.requireRecoverable(organizationId);
          yield* repository.auth.authFlow.revokeByConnection(id);
          yield* repository.auth.sessionAuthentication.revokeByConnection(id);
        }
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "auth.connection_configured",
          targetType: "identity_connection",
          targetId: id,
          metadata: { revision },
        });
        return view(next);
      }),
    );
  });
  const change = Effect.fn("Application.organization.identityConnection.change")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
    expectedRevision: number,
    action: "activate" | "disable",
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const current = yield* access.requireConnection(organizationId, id, true);
        yield* requireOwner(actor, organizationId, true);
        if (current.revision !== expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        if (
          (action === "activate" && current.status === "active") ||
          (action === "disable" && current.status === "disabled")
        )
          return view(current);
        if (
          action === "activate" &&
          (current.status !== "tested" || current.testedRevision !== current.revision)
        )
          return yield* new IdentityError({ code: "CONNECTION_NOT_TESTED" });
        const next =
          action === "activate"
            ? {
                ...current,
                status: "active" as const,
                activatedAt: current.activatedAt ?? (yield* DateTime.now),
                updatedAt: yield* DateTime.now,
              }
            : {
                ...current,
                status: "disabled" as const,
                revision: current.revision + 1,
                testedAt: null,
                testedRevision: null,
                secretsCiphertext: yield* secrets.encryptConnection(
                  id,
                  current.revision + 1,
                  yield* secrets.decryptConnection(current),
                ),
                updatedAt: yield* DateTime.now,
              };
        yield* repository.auth.identityConnection.update(next, current.revision);
        if (action === "disable") {
          yield* ownerPaths.requireRecoverable(organizationId);
          yield* repository.auth.authFlow.revokeByConnection(id);
          yield* repository.auth.sessionAuthentication.revokeByConnection(id);
        }
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType:
            action === "activate" ? "auth.connection_activated" : "auth.connection_disabled",
          targetType: "identity_connection",
          targetId: id,
          metadata: { revision: next.revision },
        });
        return view(next);
      }),
    );
  });
  return {
    list,
    get,
    createOidc,
    updateOidc: save,
    refreshMetadata: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      expectedRevision: number,
    ) => save(actor, organizationId, id, { expectedRevision }, true),
    activate: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      revision: number,
    ) => change(actor, organizationId, id, revision, "activate"),
    disable: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      revision: number,
    ) => change(actor, organizationId, id, revision, "disable"),
  };
});
