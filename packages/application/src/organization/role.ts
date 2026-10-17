import { Effect, Predicate, Schema } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import {
  OrganizationError,
  type OrganizationId,
  type OrganizationRoleId,
} from "@usepreface/protocol";
import type { SessionActor, ListOrganizationRolesQuery } from "@usepreface/protocol/dto";
import {
  CreateOrganizationRoleInput,
  UpdateOrganizationRoleInput,
} from "@usepreface/protocol/input";

import { OrganizationAccess } from "#/organization/access";
import { makeBindingAudit } from "#/organization/binding-audit";
import { builtinOrganizationRoles } from "#/organization/builtin-roles";
import { requireDelegablePermissions } from "#/organization/delegation";
import { publicRole } from "#/organization/views";

export const makeOrganizationRoleApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const recordBindingEvent = yield* makeBindingAudit;
  const list = Effect.fn("Application.organization.role.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: ListOrganizationRolesQuery,
  ) {
    yield* access.requirePermissions(actor, organizationId, ["roles.read"]);
    const limit = input.limit ?? 25;
    const rows = yield* repository.organization.role.listByOrganizationId(organizationId, {
      ...input,
      limit: limit + 1,
    });
    const visible = rows.slice(0, limit);
    return {
      roles: visible.map(publicRole),
      nextCursor: rows.length > limit ? (visible.at(-1)?.id ?? null) : null,
    };
  });
  const create = Effect.fn("Application.organization.role.create")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: CreateOrganizationRoleInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CreateOrganizationRoleInput))(
      input,
    ).pipe(Effect.mapError(() => new OrganizationError({ code: "INVALID_INPUT" })));
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(actor, organizationId, ["roles.manage"], {
          lock: true,
        });
        if (builtinOrganizationRoles.some((role) => role.key === decoded.key))
          return yield* new OrganizationError({ code: "BUILTIN_ROLE_PROTECTED" });
        yield* requireDelegablePermissions(resolved.permissions, decoded.permissions);
        const role = yield* repository.organization.role
          .create({ ...decoded, organizationId, kind: "custom" })
          .pipe(
            Effect.mapError((error) =>
              Predicate.isTagged(error.reason, "UniqueViolation") &&
              error.reason.constraint === "role_organization_key_uidx"
                ? new OrganizationError({ code: "ROLE_KEY_UNAVAILABLE" })
                : error,
            ),
          );
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.role_created",
          targetType: "organization_role",
          targetId: role.id,
          metadata: { key: role.key, permissions: role.permissions },
        });
        return publicRole(role);
      }),
    );
  });
  const update = Effect.fn("Application.organization.role.update")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    roleId: OrganizationRoleId,
    input: UpdateOrganizationRoleInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(UpdateOrganizationRoleInput))(
      input,
    ).pipe(Effect.mapError(() => new OrganizationError({ code: "INVALID_INPUT" })));
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(actor, organizationId, ["roles.manage"], {
          lock: true,
        });
        const current = yield* repository.organization.role.findById(organizationId, roleId);
        if (current === undefined || current.archivedAt !== null)
          return yield* new OrganizationError({ code: "ROLE_NOT_FOUND" });
        if (current.kind === "builtin")
          return yield* new OrganizationError({ code: "BUILTIN_ROLE_PROTECTED" });
        yield* requireDelegablePermissions(resolved.permissions, current.permissions);
        const permissions = decoded.permissions ?? current.permissions;
        yield* requireDelegablePermissions(resolved.permissions, permissions);
        const role = yield* repository.organization.role.update(organizationId, roleId, {
          name: decoded.name ?? current.name,
          permissions,
        });
        if (role === undefined)
          return yield* Effect.die(new Error("Locked custom role update returned no row"));
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.role_updated",
          targetType: "organization_role",
          targetId: role.id,
          metadata: { key: role.key, permissions: role.permissions },
        });
        return publicRole(role);
      }),
    );
  });
  const archive = Effect.fn("Application.organization.role.archive")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    roleId: OrganizationRoleId,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(actor, organizationId, ["roles.manage"], {
          lock: true,
        });
        const role = yield* repository.organization.role.findById(organizationId, roleId);
        if (role === undefined) return yield* new OrganizationError({ code: "ROLE_NOT_FOUND" });
        if (role.kind === "builtin")
          return yield* new OrganizationError({ code: "BUILTIN_ROLE_PROTECTED" });
        yield* requireDelegablePermissions(resolved.permissions, role.permissions);
        if (role.archivedAt !== null) return;
        yield* repository.organization.role.archive(organizationId, roleId);
        const revoked = yield* repository.organization.roleBinding.revokeAllByRoleId(
          organizationId,
          roleId,
        );
        for (const binding of revoked)
          yield* recordBindingEvent(actor, binding, "organization.role_revoked");
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.role_archived",
          targetType: "organization_role",
          targetId: role.id,
          metadata: { key: role.key, permissions: role.permissions },
        });
      }),
    );
  });
  return { list, create, update, archive } as const;
});
