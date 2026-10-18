import { Effect } from "effect";

import { makeInvitationAcceptance } from "#/organization/invitation/acceptance";
import { makeInvitationDeliveryStatus } from "#/organization/invitation/delivery-status";
import { makeInvitationManagement } from "#/organization/invitation/management";
import { makeInvitationVerification } from "#/organization/invitation/verification";

export const makeInvitationApplication = Effect.gen(function* () {
  return {
    ...(yield* makeInvitationManagement),
    delivery: yield* makeInvitationDeliveryStatus,
    requestVerification: yield* makeInvitationVerification,
    accept: yield* makeInvitationAcceptance,
  } as const;
});
