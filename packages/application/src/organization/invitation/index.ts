import { Effect } from "effect";

import { makeInvitationAcceptance } from "#/organization/invitation/acceptance";
import { makeInvitationManagement } from "#/organization/invitation/management";
import { makeInvitationVerification } from "#/organization/invitation/verification";

export const makeInvitationApplication = Effect.gen(function* () {
  return {
    ...(yield* makeInvitationManagement),
    requestVerification: yield* makeInvitationVerification,
    accept: yield* makeInvitationAcceptance,
  } as const;
});
