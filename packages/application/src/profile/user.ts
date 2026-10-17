import { Effect, Schema } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { ProfileError } from "@usepreface/protocol";
import type { SessionActor, PublicUser } from "@usepreface/protocol/dto";
import { UpdateProfileInput } from "@usepreface/protocol/input";

import { OrganizationAccess } from "#/organization/access";
import { mergeUserMetadata } from "#/profile/metadata";

export const makeProfileApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const get = Effect.fn("Application.auth.profile.get")(function* (actor: SessionActor) {
    yield* access.requireActor(actor);
    const profile = yield* repository.auth.user.findProfileById(actor.user.id);
    if (profile === undefined)
      return yield* Effect.die(new Error("Authenticated user has no profile"));
    return {
      id: profile.id,
      metadata: profile.metadata,
      email: profile.email,
      emailVerifiedAt: profile.emailVerifiedAt,
    } satisfies PublicUser;
  });
  const update = Effect.fn("Application.auth.profile.update")(function* (
    actor: SessionActor,
    input: UpdateProfileInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(UpdateProfileInput))(
      input,
    ).pipe(Effect.mapError(() => new ProfileError({ code: "INVALID_INPUT" })));
    return yield* transaction.run(
      Effect.gen(function* () {
        const current = yield* repository.auth.user.lockById(actor.user.id);
        yield* access.requireActor(actor);
        if (current === undefined)
          return yield* Effect.die(new Error("Authenticated user disappeared"));
        yield* repository.auth.user.updateMetadata(
          current.id,
          mergeUserMetadata(current.metadata, decoded.metadata),
        );
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "auth.profile_updated",
          targetType: "user",
          targetId: actor.user.id,
          metadata: {
            changedFields: (["name", "title", "bio"] as const).filter(
              (field) => decoded.metadata[field] !== undefined,
            ),
          },
        });
        return yield* get(actor);
      }),
    );
  });
  return { get, update };
});
