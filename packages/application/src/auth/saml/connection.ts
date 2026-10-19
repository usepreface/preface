import { DateTime, Effect, Schema } from "effect";

import { CertificateCrypto } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { IdentityConnectionId, IdentityError, type OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { CreateSamlConnectionInput, UpdateSamlConnectionInput } from "@usepreface/protocol/input";
import type { SamlConnection } from "@usepreface/protocol/model";

import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { AuthenticationLinks } from "#/auth/links";
import { SamlIdentity } from "#/auth/saml/provider";
import { OrganizationAccess } from "#/organization/access";
import { makeOrganizationOwnerPaths } from "#/organization/authentication/owner-paths";

export const publicSamlConnection = (connection: SamlConnection) => ({
  id: connection.id,
  organizationId: connection.organizationId,
  provider: connection.provider,
  name: connection.name,
  status: connection.status,
  revision: connection.revision,
  configuration: connection.configuration,
  metadataUrl: connection.configuration.entityId,
  testedRevision: connection.testedRevision,
  testedAt: connection.testedAt,
  activatedAt: connection.activatedAt,
  createdAt: connection.createdAt,
  updatedAt: connection.updatedAt,
});

export const makeSamlConnectionApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const certificates = yield* CertificateCrypto;
  const organizations = yield* OrganizationAccess;
  const identities = yield* makeIdentityAccess;
  const secrets = yield* makeIdentitySecrets;
  const paths = yield* makeOrganizationOwnerPaths;
  const provider = yield* SamlIdentity;
  const links = yield* AuthenticationLinks;
  const requireOwner = Effect.fn("SamlConnection.requireOwner")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    lock = false,
  ) {
    const resolved = yield* organizations.requireOwner(actor, organizationId, { lock });
    yield* identities.requireVerifiedEmail(actor);
    return resolved;
  });
  const requireConnection = Effect.fn("SamlConnection.requireConnection")(function* (
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    lock = false,
  ) {
    const found = yield* repository.auth.identityConnection.findByOrganizationAndId(
      organizationId,
      connectionId,
    );
    const connection =
      lock && found !== undefined
        ? yield* repository.auth.identityConnection.lockById(connectionId)
        : found;
    if (connection?.provider !== "saml" || connection.organizationId !== organizationId)
      return yield* new IdentityError({ code: "CONNECTION_NOT_FOUND" });
    return connection;
  });
  const createSaml = Effect.fn("Application.organization.identityConnection.createSaml")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: CreateSamlConnectionInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CreateSamlConnectionInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    yield* requireOwner(actor, organizationId);
    const id = Schema.decodeSync(IdentityConnectionId)(generateUuid7());
    const signing = yield* certificates.generateSigningCertificate();
    const ciphertext = yield* secrets.encryptConnection(id, 1, signing.privateKey);
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* requireOwner(actor, organizationId, true);
        const now = yield* DateTime.now;
        const connection = yield* repository.auth.identityConnection.createSaml({
          id,
          organizationId,
          provider: "saml",
          name: decoded.name,
          status: "draft",
          revision: 1,
          secretsCiphertext: ciphertext,
          activatedAt: null,
          testedRevision: null,
          testedAt: null,
          createdAt: now,
          updatedAt: now,
          configuration: {
            version: 1,
            entityId: new URL(
              `/api/v1/organization/identity-connections/${id}/saml/metadata`,
              links.publicOrigin,
            ).href,
            callbackUrl: new URL(`/api/v1/auth/saml/${id}/acs`, links.publicOrigin).href,
            signingCertificate: signing.certificate,
            idp: null,
          },
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
        return publicSamlConnection(connection);
      }),
    );
  });
  const save = Effect.fn("Application.organization.identityConnection.updateSaml")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    input: UpdateSamlConnectionInput,
    rotateSigningKey = false,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(UpdateSamlConnectionInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    if (!rotateSigningKey && decoded.name === undefined && decoded.idp === undefined)
      return yield* new IdentityError({ code: "INVALID_INPUT" });
    yield* requireOwner(actor, organizationId);
    const previous = yield* requireConnection(organizationId, connectionId);
    if (previous.revision !== decoded.expectedRevision)
      return yield* new IdentityError({ code: "REVISION_CONFLICT" });
    if (
      previous.activatedAt !== null &&
      decoded.idp !== undefined &&
      (decoded.idp.entityId !== previous.configuration.idp?.entityId ||
        decoded.idp.nameIdFormat !== previous.configuration.idp?.nameIdFormat)
    )
      return yield* new IdentityError({ code: "IDENTITY_CONFIGURATION_IMMUTABLE" });
    const idp =
      decoded.idp === undefined
        ? previous.configuration.idp
        : yield* provider.validateConfiguration(decoded.idp);
    const signing = rotateSigningKey ? yield* certificates.generateSigningCertificate() : undefined;
    const changesTrust = decoded.idp !== undefined || rotateSigningKey;
    const revision = previous.revision + (changesTrust ? 1 : 0);
    const ciphertext = changesTrust
      ? yield* secrets.encryptConnection(
          connectionId,
          revision,
          signing?.privateKey ?? (yield* secrets.decryptConnection(previous)),
        )
      : previous.secretsCiphertext;
    return yield* transaction.run(
      Effect.gen(function* () {
        const current = yield* requireConnection(organizationId, connectionId, true);
        yield* requireOwner(actor, organizationId, true);
        if (
          current.revision !== previous.revision ||
          (current.activatedAt === null) !== (previous.activatedAt === null)
        )
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        const next = {
          ...current,
          name: decoded.name ?? current.name,
          revision,
          secretsCiphertext: ciphertext,
          configuration: {
            ...current.configuration,
            idp,
            signingCertificate: signing?.certificate ?? current.configuration.signingCertificate,
          },
          updatedAt: yield* DateTime.now,
          ...(changesTrust
            ? { status: "draft" as const, testedAt: null, testedRevision: null }
            : {}),
        };
        yield* repository.auth.identityConnection.update(next, current.revision);
        if (changesTrust) {
          yield* paths.requireRecoverable(organizationId);
          yield* repository.auth.authFlow.revokeByConnection(connectionId);
          yield* repository.auth.sessionAuthentication.revokeByConnection(connectionId);
        }
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "auth.connection_configured",
          targetType: "identity_connection",
          targetId: connectionId,
          metadata: { revision },
        });
        return publicSamlConnection(next);
      }),
    );
  });
  const change = Effect.fn("SamlConnection.change")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    expectedRevision: number,
    action: "activate" | "disable",
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const current = yield* requireConnection(organizationId, connectionId, true);
        yield* requireOwner(actor, organizationId, true);
        if (current.revision !== expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        if (
          (action === "activate" && current.status === "active") ||
          (action === "disable" && current.status === "disabled")
        )
          return publicSamlConnection(current);
        if (
          action === "activate" &&
          (current.configuration.idp === null ||
            current.status !== "tested" ||
            current.testedRevision !== current.revision)
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
                updatedAt: yield* DateTime.now,
                secretsCiphertext: yield* secrets.encryptConnection(
                  connectionId,
                  current.revision + 1,
                  yield* secrets.decryptConnection(current),
                ),
              };
        yield* repository.auth.identityConnection.update(next, current.revision);
        if (action === "disable") {
          yield* paths.requireRecoverable(organizationId);
          yield* repository.auth.authFlow.revokeByConnection(connectionId);
          yield* repository.auth.sessionAuthentication.revokeByConnection(connectionId);
        }
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType:
            action === "activate" ? "auth.connection_activated" : "auth.connection_disabled",
          targetType: "identity_connection",
          targetId: connectionId,
          metadata: { revision: next.revision },
        });
        return publicSamlConnection(next);
      }),
    );
  });
  const metadata = Effect.fn("Application.auth.saml.metadata")(function* (
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
  ) {
    const connection = yield* requireConnection(organizationId, connectionId);
    const now = DateTime.toEpochMillis(yield* DateTime.now);
    const keys = yield* repository.auth.identityConnectionKey.list(connectionId);
    return yield* provider.metadata({
      additionalSigningCertificates: keys
        .filter(
          (key) =>
            key.certificate !== connection.configuration.signingCertificate &&
            DateTime.toEpochMillis(key.expiresAt) > now &&
            (key.status === "retiring" ||
              (key.status === "pending" &&
                key.connectionRevision === connection.revision &&
                DateTime.toEpochMillis(key.createdAt) > now - 7 * 86400000)),
        )
        .map((key) => key.certificate),
      configuration: connection.configuration,
      privateKey: yield* secrets.decryptConnection(connection),
    });
  });
  return {
    createSaml,
    updateSaml: save,
    requireConnection,
    metadata,
    rotateSigningKey: (
      actor: SessionActor,
      organizationId: OrganizationId,
      id: IdentityConnectionId,
      revision: number,
    ) => save(actor, organizationId, id, { expectedRevision: revision }, true),
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
