import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi, CurrentActor } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { UpdateProfileInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";
export const ProfileRoutes = HttpApiBuilder.group(PrefaceApi, "profile", (handlers) =>
  Effect.gen(function* () {
    const profile = (yield* Application).auth.profile;
    return handlers.handleAll({
      get: Effect.fn("http.profile.get")(function* () {
        return yield* profile.get(yield* CurrentActor).pipe(mapInfrastructureError);
      }),
      update: Effect.fn("http.profile.update")(function* ({ payload }) {
        const input = yield* Schema.decodeUnknownEffect(UpdateProfileInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* profile.update(yield* CurrentActor, input).pipe(mapInfrastructureError);
      }),
    });
  }),
);
