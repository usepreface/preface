import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";

export const makeIdentityAccess = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const access = yield* OrganizationAccess;
  const requireVerifiedEmail = Effect.fn("IdentityAccess.requireVerifiedEmail")(function* (
    actor: SessionActor,
  ) {
    yield* access.requireActor(actor);
    const address = yield* repository.auth.userEmail.findPrimaryByUserId(actor.user.id);
    if (
      address === undefined ||
      address.verifiedAt === null ||
      !address.loginEnabled ||
      address.removedAt !== null
    )
      return yield* new IdentityError({ code: "EMAIL_UNAVAILABLE" });
    return address;
  });
  const requireInstanceOwner = Effect.fn("IdentityAccess.requireInstanceOwner")(function* (
    actor: SessionActor,
  ) {
    yield* requireVerifiedEmail(actor);
    if ((yield* repository.instance.owner.findActiveByUserId(actor.user.id)) === undefined)
      return yield* new IdentityError({ code: "FORBIDDEN" });
  });
  return { requireVerifiedEmail, requireInstanceOwner };
});
