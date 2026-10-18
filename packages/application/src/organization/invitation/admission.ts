import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import { InvitationError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { OrganizationInvitation } from "@usepreface/protocol/model";

import { makeBindingAudit } from "#/organization/binding-audit";
import { makeInvitationAudit } from "#/organization/invitation/audit";
import { makeInvitationAuthority } from "#/organization/invitation/authority";

// Call inside the caller's transaction after mailbox/identity proof and session resolution.
export const makeInvitationAdmission = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const authority = yield* makeInvitationAuthority;
  const emails = yield* EmailJobs;
  const audit = yield* makeInvitationAudit;
  const recordBinding = yield* makeBindingAudit;
  return Effect.fn("Invitation.admit")(function* (
    invitation: OrganizationInvitation,
    actor: SessionActor,
  ) {
    if (actor.user.email !== invitation.email)
      return yield* new InvitationError({ code: "ACCOUNT_MISMATCH" });
    const inviter = yield* authority.requireInviter(invitation);
    let member = yield* repository.organization.member.findByUserId(
      invitation.organizationId,
      actor.user.id,
    );
    if (member?.suspendedAt !== null && member?.suspendedAt !== undefined)
      return yield* new InvitationError({ code: "RECIPIENT_UNAVAILABLE" });
    if (member !== undefined) {
      const grants = yield* repository.organization.roleBinding.listActiveByMemberId(
        invitation.organizationId,
        member.id,
      );
      if (
        !inviter.isOwner &&
        grants.some((grant) => grant.role.kind === "builtin" && grant.role.key === "owner")
      )
        return yield* new InvitationError({ code: "INVITER_NOT_AUTHORIZED" });
      if (member.removedAt !== null) {
        // Removal revokes grants. Readmission restores only this invitation's approved assignments.
        member = yield* repository.organization.member.readmit(
          invitation.organizationId,
          member.id,
        );
        if (member === undefined)
          return yield* new InvitationError({ code: "RECIPIENT_UNAVAILABLE" });
      }
    } else {
      member = yield* repository.organization.member.create({
        organizationId: invitation.organizationId,
        userId: actor.user.id,
      });
    }
    for (const role of inviter.roles) {
      const grant = yield* repository.organization.roleBinding.grant({
        organizationId: invitation.organizationId,
        memberId: member.id,
        roleId: role.id,
        grantedByMemberId: inviter.member.id,
      });
      if (grant.created) yield* recordBinding(actor, grant.binding, "organization.role_granted");
    }
    for (const assignment of inviter.teams) {
      const previous = yield* repository.organization.team.member.find(
        invitation.organizationId,
        assignment.team.id,
        member.id,
      );
      if (previous === undefined || previous.removedAt !== null) {
        const membership = yield* repository.organization.team.member.add(
          invitation.organizationId,
          assignment.team.id,
          member.id,
          inviter.member.id,
        );
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId: invitation.organizationId,
          eventType: "team.member_added",
          targetType: "team_member",
          targetId: membership.id,
          metadata: { teamId: assignment.team.id, memberId: member.id },
        });
      }
      for (const role of assignment.roles) {
        const grant = yield* repository.organization.roleBinding.grant({
          organizationId: invitation.organizationId,
          teamId: assignment.team.id,
          memberId: member.id,
          roleId: role.id,
          grantedByMemberId: inviter.member.id,
        });
        if (grant.created) yield* recordBinding(actor, grant.binding, "organization.role_granted");
      }
    }

    if (
      (yield* repository.organization.invitation.accept(
        invitation.organizationId,
        invitation.id,
        actor.user.id,
      )) === undefined
    )
      return yield* new InvitationError({ code: "INVALID_INVITATION" });
    yield* emails.cancel(invitation.emailJobId);
    yield* audit.record(invitation, "organization.invitation_accepted", actor);
    return member;
  });
});
