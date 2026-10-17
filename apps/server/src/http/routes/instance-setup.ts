import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError, SecretTokenFromString } from "@usepreface/protocol";
import { CompleteBootstrapInput } from "@usepreface/protocol/input";

import { setSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";

export const InstanceSetupRoutes = HttpApiBuilder.group(PrefaceApi, "instanceSetup", (handlers) =>
  Effect.gen(function* () {
    const bootstrap = (yield* Application).instance.bootstrap;

    return handlers.handleAll({
      status: () => bootstrap.getStatus().pipe(mapInfrastructureError),
      inspect: Effect.fn("http.instanceSetup.inspect")(function* ({ payload }) {
        const token = yield* Schema.decodeUnknownEffect(SecretTokenFromString)(payload.token).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* bootstrap.inspectToken(token).pipe(mapInfrastructureError);
      }),
      complete: Effect.fn("http.instanceSetup.complete")(function* ({ payload }) {
        const input = yield* Schema.decodeUnknownEffect(CompleteBootstrapInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        const result = yield* bootstrap.complete(input).pipe(mapInfrastructureError);
        yield* setSessionCookie(result.sessionToken, result.actor.session.expiresAt);
        return result.actor;
      }),
    });
  }),
);
