import { Effect } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import {
  TeamError,
  type OrganizationId,
  type TeamId,
  type OrganizationMemberId,
} from "@usepreface/protocol";
import type { SessionActor, ListTeamMembersQuery } from "@usepreface/protocol/dto";

import { makeBindingAudit } from "#/organization/binding-audit";
import { requireDelegablePermissions } from "#/organization/delegation";
import { TeamAccess } from "#/organization/team/access";
import { publicRole } from "#/organization/views";

export const makeTeamMemberApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* TeamAccess;
  const recordBinding = yield* makeBindingAudit;
  const add = Effect.fn("Application.organization.team.member.add")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
    memberId: OrganizationMemberId,
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(
          actor,
          organizationId,
          teamId,
          ["team.members.manage"],
          { lock: true },
        );
        const member = yield* repository.organization.member.findById(organizationId, memberId);
        const user =
          member === undefined ? undefined : yield* repository.auth.user.findById(member.userId);
        if (
          member === undefined ||
          member.removedAt !== null ||
          member.suspendedAt !== null ||
          user === undefined ||
          user.disabledAt !== null
        )
          return yield* new TeamError({ code: "MEMBER_NOT_ACTIVE" });
        const previous = yield* repository.organization.team.member.find(
          organizationId,
          teamId,
          memberId,
        );
        if (previous !== undefined && previous.removedAt === null)
          return { isEffectiveMember: true };
        const role = yield* repository.organization.role.findByKey(
          organizationId,
          "member",
          "team",
        );
        if (role === undefined)
          return yield* Effect.die(new Error("Organization has no team member role"));
        yield* requireDelegablePermissions(resolved.permissions, role.permissions);
        const membership = yield* repository.organization.team.member.add(
          organizationId,
          teamId,
          memberId,
          resolved.organization.member.id,
        );
        const grant = yield* repository.organization.roleBinding.grant({
          organizationId,
          teamId,
          memberId,
          roleId: role.id,
          grantedByMemberId: resolved.organization.member.id,
        });
        if (grant.created) yield* recordBinding(actor, grant.binding, "organization.role_granted");
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "team.member_added",
          targetType: "team_member",
          targetId: membership.id,
          metadata: { teamId, memberId },
        });
        return { isEffectiveMember: true };
      }),
    );
  });
  const remove = Effect.fn("Application.organization.team.member.remove")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
    memberId: OrganizationMemberId,
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(
          actor,
          organizationId,
          teamId,
          ["team.members.manage"],
          {
            lock: true,
          },
        );
        const currentGrants = yield* repository.organization.roleBinding.listActiveByMemberId(
          organizationId,
          memberId,
          teamId,
        );
        yield* requireDelegablePermissions(
          resolved.permissions,
          currentGrants.flatMap((grant) => grant.role.permissions),
        );
        const removed = yield* repository.organization.team.member.remove(
          organizationId,
          teamId,
          memberId,
        );
        if (removed !== undefined) {
          const grants = yield* repository.organization.roleBinding.revokeTeamMember(
            organizationId,
            teamId,
            memberId,
          );
          for (const grant of grants)
            yield* recordBinding(actor, grant, "organization.role_revoked");
          yield* repository.audit.event.append({
            actorKind: "user",
            actorUserId: actor.user.id,
            organizationId,
            eventType: "team.member_removed",
            targetType: "team_member",
            targetId: removed.id,
            metadata: { teamId, memberId },
          });
        }
        return { isEffectiveMember: false };
      }),
    );
  });
  const list = Effect.fn("Application.organization.team.member.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    teamId: TeamId,
    input: ListTeamMembersQuery = {},
  ) {
    yield* access.requirePermissions(actor, organizationId, teamId, ["team.members.read"]);
    const limit = input.limit ?? 25;
    const rows = yield* repository.organization.team.member.list(organizationId, teamId, {
      ...input,
      limit: limit + 1,
    });
    const visible = rows.slice(0, limit);
    const grants = yield* repository.organization.roleBinding.listActiveByMemberIds(
      organizationId,
      visible.map((row) => row.membership.memberId),
      teamId,
    );
    return {
      members: visible.map((row) => ({
        id: row.membership.id,
        memberId: row.membership.memberId,
        userId: row.user.id,
        metadata: row.user.metadata,
        joinedAt: row.membership.joinedAt,
        roles: grants
          .filter((grant) => grant.binding.memberId === row.membership.memberId)
          .map((grant) => publicRole(grant.role)),
      })),
      nextCursor: rows.length > limit ? (rows.at(limit - 1)?.membership.id ?? null) : null,
    };
  });
  return { add, remove, list };
});
