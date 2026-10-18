import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import {
  InvitationError,
  type OrganizationId,
  type OrganizationInvitationId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";

export const makeInvitationDeliveryStatus = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const access = yield* OrganizationAccess;
  return Effect.fn("Application.organization.invitation.delivery")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: OrganizationInvitationId,
  ) {
    yield* access.requirePermissions(actor, organizationId, ["members.manage"]);
    const invitation = yield* repository.organization.invitation.findById(organizationId, id);
    if (invitation === undefined)
      return yield* new InvitationError({ code: "INVITATION_NOT_FOUND" });
    const job = yield* repository.jobs.email.findById(invitation.emailJobId);
    if (job === undefined)
      return yield* Effect.die(new Error("Invitation delivery job is missing"));
    return {
      status: job.status,
      attempts: job.attempts,
      provider: job.provider,
      lastErrorCode: job.lastErrorCode,
      availableAt: job.availableAt,
      sentAt: job.sentAt,
      expiresAt: job.expiresAt,
    };
  });
});
