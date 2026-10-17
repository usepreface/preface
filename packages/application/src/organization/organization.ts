import { Effect, Predicate, Schema } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { OrganizationError, type OrganizationId } from "@usepreface/protocol";
import type {
  SessionActor,
  ListOrganizationsQuery,
  OrganizationDetail,
} from "@usepreface/protocol/dto";
import { CreateOrganizationInput, UpdateOrganizationInput } from "@usepreface/protocol/input";

import { OrganizationAccess } from "#/organization/access";
import { organizationAuthPolicyView } from "#/organization/authentication/views";
import { builtinOrganizationRoles, builtinTeamRoles } from "#/organization/builtin-roles";
import { publicAccess, publicMember, publicOrganization } from "#/organization/views";
import { mergeOrganizationMetadata } from "#/profile/metadata";
import { isInstallationAuthentication } from "#/security/authentication-method";

export const makeOrganizationApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const capabilities = Effect.fn("Application.instance.capabilities.get")(function* (
    actor: SessionActor,
  ) {
    const { evidence } = yield* access.requireActor(actor);
    const owner = yield* repository.instance.owner.findActiveByUserId(actor.user.id);
    return {
      canCreateOrganization:
        owner !== undefined && evidence.some((proof) => isInstallationAuthentication(proof.method)),
    };
  });
  const get = Effect.fn("Application.organization.organization.get")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    const resolved = yield* access.requirePermissions(actor, organizationId, ["organization.read"]);
    return {
      organization: publicOrganization(resolved.organization),
      membership: publicMember(resolved.member, resolved.user.metadata, resolved.roles),
      access: publicAccess(resolved),
    } satisfies OrganizationDetail;
  });
  const create = Effect.fn("Application.organization.organization.create")(function* (
    actor: SessionActor,
    input: CreateOrganizationInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CreateOrganizationInput))(
      input,
    ).pipe(Effect.mapError(() => new OrganizationError({ code: "INVALID_INPUT" })));
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.instance.installation.lock();
        const { evidence } = yield* access.requireActor(actor);
        if (!evidence.some((proof) => isInstallationAuthentication(proof.method)))
          return yield* new OrganizationError({ code: "AUTHENTICATION_REQUIRED" });
        if ((yield* repository.instance.owner.findActiveByUserId(actor.user.id)) === undefined)
          return yield* new OrganizationError({ code: "FORBIDDEN" });
        const organization = yield* repository.organization.organization
          .create({
            ...decoded,
            metadata: { version: 1, ...decoded.metadata },
            createdByUserId: actor.user.id,
          })
          .pipe(
            Effect.mapError((error) =>
              Predicate.isTagged(error.reason, "UniqueViolation") &&
              error.reason.constraint === "organization_slug_uidx"
                ? new OrganizationError({ code: "SLUG_UNAVAILABLE" })
                : error,
            ),
          );
        const member = yield* repository.organization.member.create({
          organizationId: organization.id,
          userId: actor.user.id,
        });
        for (const definition of builtinOrganizationRoles) {
          const role = yield* repository.organization.role.create({
            organizationId: organization.id,
            kind: "builtin",
            ...definition,
          });
          if (definition.key === "owner") {
            yield* repository.organization.roleBinding.grant({
              organizationId: organization.id,
              roleId: role.id,
              memberId: member.id,
              grantedByMemberId: member.id,
            });
            yield* repository.audit.event.append({
              organizationId: organization.id,
              actorKind: "user",
              actorUserId: actor.user.id,
              eventType: "organization.owner_granted",
              targetType: "organization_member",
              targetId: member.id,
              metadata: {},
            });
          }
        }
        for (const definition of builtinTeamRoles)
          yield* repository.organization.role.create({
            organizationId: organization.id,
            scopeKind: "team",
            kind: "builtin",
            ...definition,
          });
        yield* repository.organization.authPolicy.createDefault(organization.id, member.id);
        yield* repository.audit.event.append({
          organizationId: organization.id,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.created",
          targetType: "organization",
          targetId: organization.id,
          metadata: { name: organization.metadata.name, slug: organization.slug },
        });
        return yield* get(actor, organization.id);
      }),
    );
  });
  const listMine = Effect.fn("Application.organization.organization.listMine")(function* (
    actor: SessionActor,
    input: ListOrganizationsQuery,
  ) {
    yield* access.requireActor(actor);
    const limit = input.limit ?? 25;
    const rows = yield* repository.organization.organization.listAccessibleByUserId(actor.user.id, {
      ...input,
      limit: limit + 1,
    });
    const visible = rows.slice(0, limit);
    return {
      organizations: visible.map(publicOrganization),
      nextCursor: rows.length > limit ? (visible.at(-1)?.id ?? null) : null,
    };
  });
  const update = Effect.fn("Application.organization.organization.update")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: UpdateOrganizationInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(UpdateOrganizationInput))(
      input,
    ).pipe(Effect.mapError(() => new OrganizationError({ code: "INVALID_INPUT" })));
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(
          actor,
          organizationId,
          ["organization.update"],
          { lock: true },
        );
        const organization = yield* repository.organization.organization
          .update(organizationId, {
            metadata: mergeOrganizationMetadata(resolved.organization.metadata, decoded.metadata),
            slug: decoded.slug ?? resolved.organization.slug,
          })
          .pipe(
            Effect.mapError((error) =>
              Predicate.isTagged(error.reason, "UniqueViolation") &&
              error.reason.constraint === "organization_slug_uidx"
                ? new OrganizationError({ code: "SLUG_UNAVAILABLE" })
                : error,
            ),
          );
        if (organization === undefined)
          return yield* Effect.die(new Error("Locked organization update returned no row"));
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.updated",
          targetType: "organization",
          targetId: organizationId,
          metadata: { name: organization.metadata.name, slug: organization.slug },
        });
        return publicOrganization(organization);
      }),
    );
  });
  const archive = Effect.fn("Application.organization.organization.archive")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requireOwner(actor, organizationId, {
          lock: true,
          allowArchived: true,
        });
        if (resolved.organization.archivedAt !== null)
          return publicOrganization(resolved.organization);
        const organization = yield* repository.organization.organization.archive(organizationId);
        if (organization === undefined)
          return yield* Effect.die(new Error("Locked organization archive returned no row"));
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.archived",
          targetType: "organization",
          targetId: organizationId,
          metadata: { name: organization.metadata.name, slug: organization.slug },
        });
        return publicOrganization(organization);
      }),
    );
  });
  const restore = Effect.fn("Application.organization.organization.restore")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requireOwner(actor, organizationId, {
          lock: true,
          allowArchived: true,
        });
        if (resolved.organization.archivedAt === null)
          return publicOrganization(resolved.organization);
        const organization = yield* repository.organization.organization.restore(organizationId);
        if (organization === undefined)
          return yield* Effect.die(new Error("Locked organization restore returned no row"));
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.restored",
          targetType: "organization",
          targetId: organizationId,
          metadata: { name: organization.metadata.name, slug: organization.slug },
        });
        return publicOrganization(organization);
      }),
    );
  });
  const getAccess = Effect.fn("Application.organization.organization.getAccess")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    return publicAccess(yield* access.requireMember(actor, organizationId));
  });
  const getAuthPolicy = Effect.fn("Application.organization.authPolicy.get")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    const { policy } = yield* access.requirePermissions(actor, organizationId, [
      "organization.read",
    ]);
    const ids = (yield* repository.organization.authPolicyConnection.listByOrganization(
      organizationId,
    )).map((entry) => entry.identityConnectionId);
    const connections =
      yield* repository.auth.identityConnection.listByOrganization(organizationId);
    return organizationAuthPolicyView(
      policy,
      ids.filter((id) =>
        connections.some((connection) => connection.id === id && connection.provider === "oidc"),
      ),
      ids.filter((id) =>
        connections.some((connection) => connection.id === id && connection.provider === "saml"),
      ),
    );
  });
  return {
    organization: { create, listMine, get, update, archive, restore, getAccess },
    capabilities: { get: capabilities },
    authPolicy: { get: getAuthPolicy },
  } as const;
});
