import { Effect, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import {
  InvitationError,
  TeamPermission,
  type OrganizationId,
  type OrganizationMemberId,
  type RolePermission,
  type TeamId,
  type OrganizationRoleId,
} from "@usepreface/protocol";
import type { InvitationAssignment } from "@usepreface/protocol/model";

import { requireDelegablePermissions } from "#/organization/delegation";

export const invitationTeams = (assignments: readonly InvitationAssignment[]) => {
  const teams = new Map<TeamId, OrganizationRoleId[]>();
  for (const assignment of assignments)
    if (assignment.teamId !== null) {
      const roles = teams.get(assignment.teamId) ?? [];
      roles.push(assignment.roleId);
      teams.set(assignment.teamId, roles);
    }
  return [...teams.entries()].map(([teamId, roleIds]) => ({ teamId, roleIds }));
};
export const makeInvitationTeamAssignments = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("InvitationAuthority.requireTeams")(function* (
    organizationId: OrganizationId,
    inviterMemberId: OrganizationMemberId,
    organizationPermissions: readonly RolePermission[],
    requested: readonly {
      readonly teamId: TeamId;
      readonly roleIds?: readonly OrganizationRoleId[];
    }[],
  ) {
    const resolved = [];
    for (const assignment of requested) {
      const team = yield* repository.organization.team.findById(organizationId, assignment.teamId);
      if (team === undefined || team.archivedAt !== null)
        return yield* new InvitationError({ code: "ASSIGNMENT_UNAVAILABLE" });
      const membership = yield* repository.organization.team.member.find(
        organizationId,
        team.id,
        inviterMemberId,
      );
      const grants =
        membership?.removedAt === null
          ? yield* repository.organization.roleBinding.listActiveByMemberId(
              organizationId,
              inviterMemberId,
              team.id,
            )
          : [];
      const permissions = organizationPermissions.includes("teams.manage")
        ? TeamPermission.literals
        : grants.flatMap((grant) => grant.role.permissions).filter(Schema.is(TeamPermission));
      if (
        !permissions.includes("team.members.manage") ||
        !permissions.includes("team.roles.assign")
      )
        return yield* new InvitationError({ code: "INVITER_NOT_AUTHORIZED" });
      const memberRole = yield* repository.organization.role.findByKey(
        organizationId,
        "member",
        "team",
      );
      if (memberRole === undefined)
        return yield* Effect.die(new Error("Organization has no team member role"));
      const roles = [];
      for (const roleId of assignment.roleIds ?? [memberRole.id]) {
        const role = yield* repository.organization.role.findById(organizationId, roleId);
        if (role === undefined || role.scopeKind !== "team" || role.archivedAt !== null)
          return yield* new InvitationError({ code: "ASSIGNMENT_UNAVAILABLE" });
        yield* requireDelegablePermissions(permissions, role.permissions).pipe(
          Effect.mapError(() => new InvitationError({ code: "ASSIGNMENT_UNAVAILABLE" })),
        );
        roles.push(role);
      }
      resolved.push({ team, roles });
    }
    return resolved;
  });
});
