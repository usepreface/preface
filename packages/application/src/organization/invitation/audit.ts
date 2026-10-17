import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { VerificationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { OrganizationInvitation } from "@usepreface/protocol/model";

export const makeInvitationAudit = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const record = Effect.fn("InvitationAudit.record")(function* (
    invitation: OrganizationInvitation,
    eventType:
      | "organization.invitation_created"
      | "organization.invitation_resent"
      | "organization.invitation_revoked"
      | "organization.invitation_accepted",
    actor: SessionActor,
  ) {
    const assignments = yield* repository.organization.invitation.assignments(
      invitation.organizationId,
      invitation.id,
    );
    yield* repository.audit.event.append({
      actorKind: "user",
      actorUserId: actor.user.id,
      organizationId: invitation.organizationId,
      eventType,
      targetType: "organization_invitation",
      targetId: invitation.id,
      metadata: {
        roleIds: assignments
          .filter((assignment) => assignment.teamId === null)
          .map((assignment) => assignment.roleId),
        teamIds: [
          ...new Set(
            assignments.flatMap((assignment) =>
              assignment.teamId === null ? [] : [assignment.teamId],
            ),
          ),
        ],
      },
    });
  });
  const verification = Effect.fn("InvitationAudit.verification")(function* (
    invitation: OrganizationInvitation,
    eventType:
      | "organization.invitation_verification_requested"
      | "organization.invitation_verification_failed",
    challengeId: VerificationId,
    attempts: number,
  ) {
    yield* repository.audit.event.append({
      actorKind: "system",
      actorUserId: null,
      organizationId: invitation.organizationId,
      eventType,
      targetType: "organization_invitation",
      targetId: invitation.id,
      metadata: { challengeId, attempts },
    });
  });
  return { record, verification };
});
