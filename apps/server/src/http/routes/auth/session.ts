import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { clearSessionCookie, readSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";

export const SessionRoutes = HttpApiBuilder.group(PrefaceApi, "session", (handlers) =>
  Effect.gen(function* () {
    const application = yield* Application;

    return handlers.handleAll({
      current: () => CurrentActor,
      revoke: Effect.fn("http.session.revoke")(function* () {
        const token = yield* readSessionCookie;
        if (token !== undefined) {
          const actor = yield* application.auth.session.resolve(token).pipe(
            Effect.catchTag("AuthenticationError", () => Effect.succeed(undefined)),
            mapInfrastructureError,
          );
          if (actor !== undefined)
            yield* application.auth.session.revokeCurrent(actor).pipe(mapInfrastructureError);
        }
        yield* clearSessionCookie;
      }),
    });
  }),
);
