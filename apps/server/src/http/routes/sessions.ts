import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { clearSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";

export const SessionsRoutes = HttpApiBuilder.group(PrefaceApi, "sessions", (handlers) =>
  Effect.gen(function* () {
    const sessions = (yield* Application).auth.session;
    return handlers.handleAll({
      list: Effect.fn("http.sessions.list")(function* ({ query }) {
        return yield* sessions.list(yield* CurrentActor, query).pipe(mapInfrastructureError);
      }),
      revoke: Effect.fn("http.sessions.revoke")(function* ({ params }) {
        const actor = yield* CurrentActor;
        yield* sessions.revoke(actor, params.sessionId).pipe(mapInfrastructureError);
        if (params.sessionId === actor.session.id) yield* clearSessionCookie;
      }),
      revokeAll: Effect.fn("http.sessions.revokeAll")(function* () {
        yield* sessions.revokeAll(yield* CurrentActor).pipe(mapInfrastructureError);
        yield* clearSessionCookie;
      }),
    });
  }),
);
