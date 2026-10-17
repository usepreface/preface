import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { SaveGoogleConnectionInput } from "@usepreface/protocol/input";

import { googleFlowCookie } from "#/http/cookies/browser-proof";
import { mapInfrastructureError } from "#/http/errors";
export const IdentityConnectionsRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "identityConnections",
  (handlers) =>
    Effect.gen(function* () {
      const google = (yield* Application).instance.authentication.google;
      return handlers.handleAll({
        getGoogle: Effect.fn("http.identityConnections.get")(function* () {
          return yield* google.get(yield* CurrentActor).pipe(mapInfrastructureError);
        }),
        saveGoogle: Effect.fn("http.identityConnections.save")(function* ({ payload }) {
          const input = yield* Schema.decodeUnknownEffect(SaveGoogleConnectionInput)(payload).pipe(
            Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
          );
          return yield* google.save(yield* CurrentActor, input).pipe(mapInfrastructureError);
        }),
        testGoogle: Effect.fn("http.identityConnections.test")(function* ({ payload }) {
          const result = yield* google
            .test(yield* CurrentActor, payload.expectedRevision)
            .pipe(mapInfrastructureError);
          yield* googleFlowCookie.set(result.browserToken, result.expiresAt);
          return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
        }),
        activateGoogle: Effect.fn("http.identityConnections.activate")(function* ({ payload }) {
          return yield* google
            .activate(yield* CurrentActor, payload.expectedRevision)
            .pipe(mapInfrastructureError);
        }),
        disableGoogle: Effect.fn("http.identityConnections.disable")(function* ({ payload }) {
          return yield* google
            .disable(yield* CurrentActor, payload.expectedRevision)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
