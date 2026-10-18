import { DateTime, Effect, Schema } from "effect";

import { CertificateCrypto } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import {
  IdentityConnectionKeyId,
  IdentityError,
  type IdentityConnectionId,
  type OrganizationId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { IdentityConnectionKey } from "@usepreface/protocol/model";

import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { makeSigningKeySecrets } from "#/auth/saml/key-secrets";
import { OrganizationAccess } from "#/organization/access";

export const publicSigningKey = (key: IdentityConnectionKey) => ({
  id: key.id,
  connectionRevision: key.connectionRevision,
  certificate: key.certificate,
  status: key.status,
  expiresAt: key.expiresAt,
  createdAt: key.createdAt,
  testedAt: key.testedAt,
  activatedAt: key.activatedAt,
  retiredAt: key.retiredAt,
});
export const isPendingKeyUsable = (
  key: IdentityConnectionKey,
  revision: number,
  now: DateTime.Utc,
) =>
  key.status === "pending" &&
  key.connectionRevision === revision &&
  DateTime.toEpochMillis(key.expiresAt) > DateTime.toEpochMillis(now) &&
  DateTime.toEpochMillis(key.createdAt) >
    DateTime.toEpochMillis(DateTime.subtractDuration(now, "7 days"));

export const makeSigningKeys = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const identities = yield* makeIdentityAccess;
  const certificates = yield* CertificateCrypto;
  const secrets = yield* makeSigningKeySecrets;
  const connectionSecrets = yield* makeIdentitySecrets;
  const authorize = Effect.fn("SigningKeys.authorize")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
    revision?: number,
    lock = false,
  ) {
    const connection = lock
      ? yield* repository.auth.identityConnection.lockById(id)
      : yield* repository.auth.identityConnection.findByOrganizationAndId(organizationId, id);
    if (connection?.provider !== "saml" || connection.organizationId !== organizationId)
      return yield* new IdentityError({ code: "CONNECTION_NOT_FOUND" });
    yield* access.requireOwner(actor, organizationId, { lock });
    yield* identities.requireRecentEmail(actor);
    if (revision !== undefined && connection.revision !== revision)
      return yield* new IdentityError({ code: "REVISION_CONFLICT" });
    return connection;
  });
  const list = Effect.fn("Application.organization.identityConnection.keys.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
  ) {
    yield* access.requireOwner(actor, organizationId);
    const connection = yield* repository.auth.identityConnection.findByOrganizationAndId(
      organizationId,
      id,
    );
    if (connection?.provider !== "saml")
      return yield* new IdentityError({ code: "CONNECTION_NOT_FOUND" });
    return { keys: (yield* repository.auth.identityConnectionKey.list(id)).map(publicSigningKey) };
  });
  const prepare = Effect.fn("Application.organization.identityConnection.keys.prepare")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
    revision: number,
  ) {
    yield* authorize(actor, organizationId, id, revision);
    const signing = yield* certificates.generateSigningCertificate();
    const keyId = Schema.decodeSync(IdentityConnectionKeyId)(generateUuid7());
    const key = {
      id: keyId,
      identityConnectionId: id,
      connectionRevision: revision,
      certificate: signing.certificate,
    };
    const ciphertext = yield* secrets.encrypt(key, signing.privateKey);
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* authorize(actor, organizationId, id, revision, true);
        const previous = yield* repository.auth.identityConnectionKey.list(id);
        // One candidate and a bounded certificate history keep metadata and operator review predictable.
        if (previous.length >= 50 || previous.some((k) => k.status === "pending"))
          return yield* new IdentityError({ code: "KEY_UNAVAILABLE" });
        const now = yield* DateTime.now;
        const created = yield* repository.auth.identityConnectionKey.create({
          ...key,
          organizationId,
          privateKeyCiphertext: ciphertext,
          status: "pending",
          expiresAt: signing.expiresAt,
          createdAt: now,
          testedAt: null,
          activatedAt: null,
          retiredAt: null,
        });
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "auth.connection_key_prepared",
          targetType: "identity_connection_key",
          targetId: keyId,
          metadata: { connectionId: id, revision },
        });
        return publicSigningKey(created);
      }),
    );
  });
  const change = Effect.fn("SigningKeys.change")(function* (
    action: "activate" | "retire",
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
    keyId: IdentityConnectionKeyId,
    revision: number,
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const connection = yield* authorize(actor, organizationId, id, revision, true);
        const key = yield* repository.auth.identityConnectionKey.find(keyId, true);
        if (key?.identityConnectionId !== id || key.organizationId !== organizationId)
          return yield* new IdentityError({ code: "KEY_NOT_FOUND" });
        const now = yield* DateTime.now;
        if (action === "activate") {
          if (!isPendingKeyUsable(key, revision, now))
            return yield* new IdentityError({ code: "KEY_UNAVAILABLE" });
          if (
            key.testedAt === null ||
            DateTime.toEpochMillis(key.testedAt) <
              DateTime.toEpochMillis(DateTime.subtractDuration(now, "15 minutes"))
          )
            return yield* new IdentityError({ code: "KEY_NOT_TESTED" });
          const privateKey = yield* secrets.decrypt(key);
          const history = yield* repository.auth.identityConnectionKey.list(id);
          const old = history.find(
            (k) =>
              k.status === "activated" &&
              k.certificate === connection.configuration.signingCertificate,
          );
          if (old !== undefined)
            yield* repository.auth.identityConnectionKey.update({ ...old, status: "retiring" });
          else {
            const details = yield* certificates.inspectSigningCertificate(
              connection.configuration.signingCertificate,
            );
            yield* repository.auth.identityConnectionKey.create({
              id: Schema.decodeSync(IdentityConnectionKeyId)(generateUuid7()),
              identityConnectionId: id,
              organizationId,
              connectionRevision: revision,
              certificate: connection.configuration.signingCertificate,
              privateKeyCiphertext: null,
              status: "retiring",
              expiresAt: details.expiresAt,
              createdAt: now,
              testedAt: connection.testedAt,
              activatedAt: connection.activatedAt,
              retiredAt: null,
            });
          }
          // SP request signing changes no IdP identity authority. Keep trust revision, current evidence and active flows.
          yield* repository.auth.identityConnection.update(
            {
              ...connection,
              secretsCiphertext: yield* connectionSecrets.encryptConnection(
                id,
                revision,
                privateKey,
              ),
              configuration: { ...connection.configuration, signingCertificate: key.certificate },
              updatedAt: now,
            },
            revision,
          );
          yield* repository.auth.identityConnectionKey.update({
            ...key,
            status: "activated",
            privateKeyCiphertext: null,
            activatedAt: now,
          });
        } else {
          if (
            key.status === "activated" &&
            key.certificate === connection.configuration.signingCertificate
          )
            return yield* new IdentityError({ code: "KEY_UNAVAILABLE" });
          if (key.status === "retired") return publicSigningKey(key);
          yield* repository.auth.identityConnectionKey.update({
            ...key,
            status: "retired",
            privateKeyCiphertext: null,
            retiredAt: now,
          });
        }
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType:
            action === "activate" ? "auth.connection_key_activated" : "auth.connection_key_retired",
          targetType: "identity_connection_key",
          targetId: keyId,
          metadata: { connectionId: id, revision },
        });
        const updated = yield* repository.auth.identityConnectionKey.find(keyId);
        if (updated === undefined)
          return yield* Effect.die(new Error("Connection key disappeared"));
        return publicSigningKey(updated);
      }),
    );
  });
  return {
    list,
    prepare,
    activate: (
      actor: SessionActor,
      org: OrganizationId,
      id: IdentityConnectionId,
      key: IdentityConnectionKeyId,
      revision: number,
    ) => change("activate", actor, org, id, key, revision),
    retire: (
      actor: SessionActor,
      org: OrganizationId,
      id: IdentityConnectionId,
      key: IdentityConnectionKeyId,
      revision: number,
    ) => change("retire", actor, org, id, key, revision),
  };
});
