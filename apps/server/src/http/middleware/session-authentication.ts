import { Effect, Layer, Schema } from "effect";

import { CurrentActor, SessionAuthentication } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { AuthenticationError, SecretToken } from "@usepreface/protocol";

import { ServerConfig } from "#/config";
import { clearSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";

export const SessionAuthenticationLive = Layer.effect(
  SessionAuthentication,
  Effect.gen(function* () {
    const application = yield* Application;
    const config = yield* ServerConfig;

    return SessionAuthentication.of({
      session: Effect.fn("http.authenticateSession")(function* (httpEffect, { credential }) {
        const actor = yield* Schema.decodeUnknownEffect(SecretToken)(credential).pipe(
          Effect.mapError(() => new AuthenticationError({ code: "UNAUTHENTICATED" })),
          Effect.flatMap(application.auth.session.resolve),
          Effect.catchTag("AuthenticationError", (error) =>
            clearSessionCookie.pipe(
              Effect.provideService(ServerConfig, config),
              Effect.andThen(Effect.fail(error)),
            ),
          ),
          mapInfrastructureError,
        );

        return yield* Effect.provideService(httpEffect, CurrentActor, actor);
      }),
    });
  }),
);
