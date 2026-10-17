import { Context, Effect, Layer, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TeamError, TeamPermission, type OrganizationId, type TeamId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";

const makeTeamAccess = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const organizations = yield* OrganizationAccess;
  const resolve = Effect.fn("TeamAccess.resolve")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
    options: { readonly lock?: boolean; readonly allowArchived?: boolean } = {},
  ) {
    const organization = yield* organizations.requireMember(actor, organizationId, {
      lock: options.lock ?? false,
    });
    const team = yield* repository.organization.team.findById(organizationId, teamId);
    if (team === undefined) return yield* new TeamError({ code: "TEAM_NOT_FOUND" });
    if (team.archivedAt !== null && options.allowArchived !== true)
      return yield* new TeamError({ code: "TEAM_ARCHIVED" });
    const membership = yield* repository.organization.team.member.find(
      organizationId,
      teamId,
      organization.member.id,
    );
    const isMember = membership !== undefined && membership.removedAt === null;
    const grants = isMember
      ? yield* repository.organization.roleBinding.listActiveByMemberId(
          organizationId,
          organization.member.id,
          teamId,
        )
      : [];
    const permissions = organization.permissions.includes("teams.manage")
      ? TeamPermission.literals
      : [
          ...new Set(
            grants.flatMap((grant) => grant.role.permissions).filter(Schema.is(TeamPermission)),
          ),
        ];
    return { organization, team, membership, isMember, permissions };
  });
  const requirePermissions = Effect.fn("TeamAccess.requirePermissions")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
    permissions: readonly TeamPermission[],
    options: { readonly lock?: boolean; readonly allowArchived?: boolean } = {},
  ) {
    const resolved = yield* resolve(actor, organizationId, teamId, options);
    if (!permissions.every((permission) => resolved.permissions.includes(permission)))
      return yield* new TeamError({ code: "FORBIDDEN" });
    return resolved;
  });
  return { resolve, requirePermissions };
});
export class TeamAccess extends Context.Service<
  TeamAccess,
  Effect.Success<typeof makeTeamAccess>
>()("@usepreface/application/organization/TeamAccess") {
  static readonly layer = Layer.effect(TeamAccess, makeTeamAccess);
}
