import { Effect, Predicate, Schema } from "effect";

import { DatabaseRepository, TransactionService, type DatabaseError } from "@usepreface/database";
import { TeamError, type OrganizationId, type TeamId } from "@usepreface/protocol";
import type {
  SessionActor,
  ListTeamsQuery,
  ListOrganizationRolesQuery,
} from "@usepreface/protocol/dto";
import { CreateTeamInput, UpdateTeamInput } from "@usepreface/protocol/input";

import { OrganizationAccess } from "#/organization/access";
import { makeBindingAudit } from "#/organization/binding-audit";
import { TeamAccess } from "#/organization/team/access";
import { publicTeam } from "#/organization/team/views";
import { publicRole } from "#/organization/views";
import { mergeOrganizationMetadata } from "#/profile/metadata";

const slugError = <A, R>(effect: Effect.Effect<A, DatabaseError, R>) =>
  effect.pipe(
    Effect.mapError((error) =>
      Predicate.isTagged(error.reason, "UniqueViolation") &&
      error.reason.constraint === "team_organization_slug_uidx"
        ? new TeamError({ code: "SLUG_UNAVAILABLE" })
        : error,
    ),
  );

export const makeTeamApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const organizations = yield* OrganizationAccess;
  const access = yield* TeamAccess;
  const recordBinding = yield* makeBindingAudit;
  const create = Effect.fn("Application.organization.team.create")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: CreateTeamInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CreateTeamInput))(input).pipe(
      Effect.mapError(() => new TeamError({ code: "INVALID_INPUT" })),
    );
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* organizations.requirePermissions(
          actor,
          organizationId,
          ["teams.manage"],
          { lock: true },
        );
        const team = yield* repository.organization.team
          .create({
            organizationId,
            slug: decoded.slug,
            metadata: { version: 1, ...decoded.metadata },
            createdByMemberId: resolved.member.id,
          })
          .pipe(slugError);
        yield* repository.organization.team.member.add(
          organizationId,
          team.id,
          resolved.member.id,
          resolved.member.id,
        );
        const role = yield* repository.organization.role.findByKey(organizationId, "admin", "team");
        if (role === undefined)
          return yield* Effect.die(
            new Error("Organization has no built-in team administrator role"),
          );
        const grant = yield* repository.organization.roleBinding.grant({
          organizationId,
          teamId: team.id,
          roleId: role.id,
          memberId: resolved.member.id,
          grantedByMemberId: resolved.member.id,
        });
        yield* recordBinding(actor, grant.binding, "organization.role_granted");
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "team.created",
          targetType: "team",
          targetId: team.id,
          metadata: { name: team.metadata.name, slug: team.slug },
        });
        return publicTeam(team);
      }),
    );
  });
  const list = Effect.fn("Application.organization.team.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: ListTeamsQuery = {},
  ) {
    const resolved = yield* organizations.requirePermissions(actor, organizationId, ["teams.read"]);
    if (input.includeArchived === true && !resolved.permissions.includes("teams.manage"))
      return yield* new TeamError({ code: "FORBIDDEN" });
    const limit = input.limit ?? 25;
    const rows = yield* repository.organization.team.list(organizationId, {
      ...input,
      limit: limit + 1,
    });
    return {
      teams: rows.slice(0, limit).map(publicTeam),
      nextCursor: rows.length > limit ? (rows.at(limit - 1)?.id ?? null) : null,
    };
  });
  const get = Effect.fn("Application.organization.team.get")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
  ) {
    const { team } = yield* access.requirePermissions(actor, organizationId, teamId, ["team.read"]);
    return publicTeam(team);
  });
  const update = Effect.fn("Application.organization.team.update")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
    input: UpdateTeamInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(UpdateTeamInput))(input).pipe(
      Effect.mapError(() => new TeamError({ code: "INVALID_INPUT" })),
    );
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(
          actor,
          organizationId,
          teamId,
          ["team.update"],
          { lock: true },
        );
        const team = yield* repository.organization.team
          .update(organizationId, teamId, {
            slug: decoded.slug ?? resolved.team.slug,
            metadata: mergeOrganizationMetadata(resolved.team.metadata, decoded.metadata),
          })
          .pipe(slugError);
        if (team === undefined)
          return yield* Effect.die(new Error("Locked team update returned no row"));
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "team.updated",
          targetType: "team",
          targetId: team.id,
          metadata: { name: team.metadata.name, slug: team.slug },
        });
        return publicTeam(team);
      }),
    );
  });
  const archive = Effect.fn("Application.organization.team.archive")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(
          actor,
          organizationId,
          teamId,
          ["team.archive"],
          { lock: true, allowArchived: true },
        );
        if (resolved.team.archivedAt !== null) return publicTeam(resolved.team);
        const team = yield* repository.organization.team.archive(organizationId, teamId);
        if (team === undefined)
          return yield* Effect.die(new Error("Locked team archive returned no row"));
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "team.archived",
          targetType: "team",
          targetId: team.id,
          metadata: { name: team.metadata.name, slug: team.slug },
        });
        return publicTeam(team);
      }),
    );
  });
  const getAccess = Effect.fn("Application.organization.team.getAccess")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
  ) {
    const resolved = yield* access.resolve(actor, organizationId, teamId);
    return { isMember: resolved.isMember, permissions: resolved.permissions };
  });
  const listRoles = Effect.fn("Application.organization.team.listRoles")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
    input: Omit<ListOrganizationRolesQuery, "scopeKind"> = {},
  ) {
    yield* access.requirePermissions(actor, organizationId, teamId, ["team.roles.read"]);
    const limit = input.limit ?? 25;
    const rows = yield* repository.organization.role.listByOrganizationId(organizationId, {
      ...input,
      scopeKind: "team",
      limit: limit + 1,
    });
    return {
      roles: rows.slice(0, limit).map(publicRole),
      nextCursor: rows.length > limit ? (rows.at(limit - 1)?.id ?? null) : null,
    };
  });
  return { create, list, get, update, archive, getAccess, listRoles };
});
