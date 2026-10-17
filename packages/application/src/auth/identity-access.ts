import { DateTime, Duration, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";
import { recentEmailAuthenticationAge } from "#/security/policy";

export const makeIdentityAccess = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const access = yield* OrganizationAccess;
  const requireRecentEmail = Effect.fn("IdentityAccess.requireRecentEmail")(function* (
    actor: SessionActor,
  ) {
    const { evidence } = yield* access.requireActor(actor);
    const cutoff =
      DateTime.toEpochMillis(yield* DateTime.now) - Duration.toMillis(recentEmailAuthenticationAge);
    if (
      !evidence.some(
        (proof) =>
          proof.method !== "google" && DateTime.toEpochMillis(proof.authenticatedAt) >= cutoff,
      )
    )
      return yield* new IdentityError({ code: "REAUTHENTICATION_REQUIRED" });
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
    yield* requireRecentEmail(actor);
    if ((yield* repository.instance.owner.findActiveByUserId(actor.user.id)) === undefined)
      return yield* new IdentityError({ code: "FORBIDDEN" });
  });
  return { requireRecentEmail, requireInstanceOwner };
});
