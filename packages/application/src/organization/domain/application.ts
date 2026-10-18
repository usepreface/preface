import { DateTime, Effect, Redacted, Schema } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import {
  IdentityError,
  OrganizationDomainId,
  type IdentityConnectionId,
  type OrganizationId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { CreateDomainInput } from "@usepreface/protocol/input";
import type { OrganizationDomain } from "@usepreface/protocol/model";
import { parse } from "tldts";

import { makeIdentityAccess } from "#/auth/identity-access";
import { OrganizationAccess } from "#/organization/access";
import { DomainDns } from "#/organization/domain/dns";

const consumerDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "ymail.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "fastmail.com",
  "tuta.com",
  "tutanota.com",
]);

export const publicDomain = (domain: OrganizationDomain) => ({
  id: domain.id,
  domain: domain.domain,
  revision: domain.revision,
  verificationMethod: domain.verificationMethod,
  verifiedAt: domain.verifiedAt,
  verifiedUntil: domain.verifiedUntil,
  revokedAt: domain.revokedAt,
});

export const makeDomainApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const tokens = yield* TokenCrypto;
  const access = yield* OrganizationAccess;
  const identityAccess = yield* makeIdentityAccess;
  const dns = yield* DomainDns;
  const requireDomain = Effect.fn("Domain.require")(function* (
    organizationId: OrganizationId,
    id: OrganizationDomainId,
    revision?: number,
  ) {
    const domain = yield* repository.organization.domain.find(organizationId, id);
    if (domain === undefined) return yield* new IdentityError({ code: "DOMAIN_NOT_FOUND" });
    if (revision !== undefined && domain.revision !== revision)
      return yield* new IdentityError({ code: "REVISION_CONFLICT" });
    return domain;
  });
  const audit = Effect.fn("Domain.audit")(function* (
    actor: SessionActor,
    domain: OrganizationDomain,
    eventType:
      | "organization.domain_created"
      | "organization.domain_challenge_rotated"
      | "organization.domain_verified"
      | "organization.domain_revoked",
  ) {
    yield* repository.audit.event.append({
      actorKind: "user",
      actorUserId: actor.user.id,
      organizationId: domain.organizationId,
      eventType,
      targetType: "organization_domain",
      targetId: domain.id,
      metadata: { revision: domain.revision, method: domain.verificationMethod },
    });
  });
  const list = Effect.fn("Application.organization.domain.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    yield* access.requireOwner(actor, organizationId);
    return {
      domains: (yield* repository.organization.domain.list(organizationId)).map(publicDomain),
    };
  });
  const create = Effect.fn("Application.organization.domain.create")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: CreateDomainInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CreateDomainInput))(input).pipe(
      Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })),
    );
    const parsed = parse(decoded.domain, { allowPrivateDomains: true });
    if (parsed.isIp || parsed.domain === null || consumerDomains.has(decoded.domain))
      return yield* new IdentityError({ code: "INVALID_INPUT" });
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* access.requireOwner(actor, organizationId, { lock: true });
        yield* identityAccess.requireRecentEmail(actor);
        const existing = (yield* repository.organization.domain.list(organizationId)).find(
          (entry) => entry.domain === decoded.domain,
        );
        if (existing !== undefined) return publicDomain(existing);
        if ((yield* repository.organization.domain.list(organizationId)).length >= 50)
          return yield* new IdentityError({ code: "INVALID_INPUT" });
        const now = yield* DateTime.now;
        const domain = yield* repository.organization.domain.create({
          id: Schema.decodeSync(OrganizationDomainId)(generateUuid7()),
          organizationId,
          domain: decoded.domain,
          revision: 1,
          verificationMethod: null,
          challengeHash: null,
          challengeExpiresAt: null,
          verifiedAt: null,
          verifiedUntil: null,
          approvedByUserId: null,
          revokedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        yield* audit(actor, domain, "organization.domain_created");
        return publicDomain(domain);
      }),
    );
  });
  const request = Effect.fn("Application.organization.domain.request")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: OrganizationDomainId,
    revision: number,
  ) {
    const token = yield* tokens.randomToken();
    const hash = yield* tokens.digestToken({ purpose: cryptoPurpose.domainChallenge, token });
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* access.requireOwner(actor, organizationId, { lock: true });
        yield* identityAccess.requireRecentEmail(actor);
        const domain = yield* requireDomain(organizationId, id, revision);
        const expiresAt = DateTime.addDuration(yield* DateTime.now, "30 minutes");
        const changed = yield* repository.organization.domain.update(
          {
            ...domain,
            revision: revision + 1,
            challengeHash: hash,
            challengeExpiresAt: expiresAt,
            updatedAt: yield* DateTime.now,
          },
          revision,
        );
        if (changed === undefined) return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        yield* audit(actor, changed, "organization.domain_challenge_rotated");
        return {
          domain: publicDomain(changed),
          recordName: `_preface-verification.${domain.domain}`,
          token,
          expiresAt,
        };
      }),
    );
  });
  const verify = Effect.fn("Application.organization.domain.verify")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: OrganizationDomainId,
    revision: number,
    method: "dns" | "operator" = "dns",
  ) {
    if (method === "operator") yield* identityAccess.requireInstanceOwner(actor);
    else {
      yield* access.requireOwner(actor, organizationId);
      yield* identityAccess.requireRecentEmail(actor);
    }
    const observed = yield* requireDomain(organizationId, id, revision);
    if (method === "dns") {
      if (
        observed.challengeHash === null ||
        observed.challengeExpiresAt === null ||
        DateTime.toEpochMillis(observed.challengeExpiresAt) <=
          DateTime.toEpochMillis(yield* DateTime.now)
      )
        return yield* new IdentityError({ code: "DOMAIN_VERIFICATION_FAILED" });
      const records = yield* dns.resolveTxt(`_preface-verification.${observed.domain}`);
      let matches = false;
      for (const record of records) {
        if (
          yield* tokens.verifyToken({
            purpose: cryptoPurpose.domainChallenge,
            token: Redacted.make(record),
            expectedDigest: observed.challengeHash,
          })
        )
          matches = true;
      }
      if (!matches) return yield* new IdentityError({ code: "DOMAIN_VERIFICATION_FAILED" });
    }
    return yield* transaction.run(
      Effect.gen(function* () {
        const organization = yield* repository.organization.organization.lockById(organizationId);
        if (organization === undefined || organization.archivedAt !== null)
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        if (method === "operator") yield* identityAccess.requireInstanceOwner(actor);
        else {
          yield* access.requireOwner(actor, organizationId);
          yield* identityAccess.requireRecentEmail(actor);
        }
        const current = yield* requireDomain(organizationId, id, revision);
        const now = yield* DateTime.now;
        if (
          method === "dns" &&
          (current.challengeHash !== observed.challengeHash ||
            current.challengeExpiresAt === null ||
            DateTime.toEpochMillis(current.challengeExpiresAt) <= DateTime.toEpochMillis(now))
        )
          return yield* new IdentityError({ code: "DOMAIN_VERIFICATION_FAILED" });
        const changed = yield* repository.organization.domain.update(
          {
            ...current,
            revision: revision + 1,
            verificationMethod: method,
            verifiedAt: now,
            verifiedUntil: DateTime.addDuration(now, "365 days"),
            approvedByUserId: method === "operator" ? actor.user.id : null,
            revokedAt: null,
            challengeHash: null,
            challengeExpiresAt: null,
            updatedAt: now,
          },
          revision,
        );
        if (changed === undefined) return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        yield* audit(actor, changed, "organization.domain_verified");
        return publicDomain(changed);
      }),
    );
  });
  const revoke = Effect.fn("Application.organization.domain.revoke")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: OrganizationDomainId,
    revision: number,
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* access.requireOwner(actor, organizationId, { lock: true });
        yield* identityAccess.requireRecentEmail(actor);
        const domain = yield* requireDomain(organizationId, id, revision);
        const now = yield* DateTime.now;
        const changed = yield* repository.organization.domain.update(
          {
            ...domain,
            revision: revision + 1,
            revokedAt: now,
            challengeHash: null,
            challengeExpiresAt: null,
            updatedAt: now,
          },
          revision,
        );
        if (changed === undefined) return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        yield* audit(actor, changed, "organization.domain_revoked");
        return publicDomain(changed);
      }),
    );
  });
  const connectionDomains = Effect.fn("Application.organization.domain.connectionDomains")(
    function* (
      actor: SessionActor,
      organizationId: OrganizationId,
      connectionId: IdentityConnectionId,
    ) {
      yield* access.requireOwner(actor, organizationId);
      const connection = yield* repository.auth.identityConnection.findByOrganizationAndId(
        organizationId,
        connectionId,
      );
      if (connection === undefined)
        return yield* new IdentityError({ code: "CONNECTION_NOT_FOUND" });
      return {
        domains: (yield* repository.organization.domain.forConnection(
          organizationId,
          connectionId,
          connection.revision,
        )).map(publicDomain),
      };
    },
  );
  const bind = Effect.fn("Application.organization.domain.bind")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    input: {
      readonly expectedRevision: number;
      readonly domainIds: readonly OrganizationDomainId[];
    },
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const connection = yield* repository.auth.identityConnection.lockById(connectionId);
        if (
          connection === undefined ||
          connection.organizationId !== organizationId ||
          connection.status !== "active"
        )
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        yield* access.requireOwner(actor, organizationId, { lock: true });
        yield* identityAccess.requireRecentEmail(actor);
        if (connection.revision !== input.expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        if (input.domainIds.length > 20 || new Set(input.domainIds).size !== input.domainIds.length)
          return yield* new IdentityError({ code: "INVALID_INPUT" });
        const domains: OrganizationDomain[] = [];
        for (const id of input.domainIds) {
          const domain = yield* requireDomain(organizationId, id);
          if (
            domain.revokedAt !== null ||
            domain.verifiedUntil === null ||
            DateTime.toEpochMillis(domain.verifiedUntil) <=
              DateTime.toEpochMillis(yield* DateTime.now)
          )
            return yield* new IdentityError({ code: "DOMAIN_NOT_VERIFIED" });
          domains.push(domain);
        }
        yield* repository.organization.domain.replaceBindings(
          organizationId,
          connectionId,
          connection.revision,
          domains,
        );
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "auth.connection_domains_updated",
          targetType: "identity_connection",
          targetId: connection.id,
          metadata: { revision: connection.revision, domainIds: input.domainIds },
        });
        return { domains: domains.map(publicDomain) };
      }),
    );
  });
  return { list, create, request, verify, revoke, connectionDomains, bind };
});
