import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { clearSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";
import { optionalSessionActor } from "#/http/routes/auth/optional-actor";

export const SessionRoutes = HttpApiBuilder.group(PrefaceApi, "session", (handlers) =>
  Effect.gen(function* () {
    const application = yield* Application;

    return handlers.handleAll({
      current: () => CurrentActor,
      revoke: Effect.fn("http.session.revoke")(function* () {
        const actor = yield* optionalSessionActor;
        if (actor !== undefined)
          yield* application.auth.session.revokeCurrent(actor).pipe(mapInfrastructureError);

        yield* clearSessionCookie;
      }),
    });
  }),
);
