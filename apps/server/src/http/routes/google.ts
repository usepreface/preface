import { Effect, Redacted, Schema } from "effect";
import { HttpServerResponse } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { IdentityError, RequestError } from "@usepreface/protocol";
import { GoogleCallbackInput } from "@usepreface/protocol/input";

import { googleFlowCookie } from "#/http/cookies/browser-proof";
import { setSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";
import { optionalSessionActor } from "#/http/routes/optional-actor";

export const GoogleRoutes = HttpApiBuilder.group(PrefaceApi, "google", (handlers) =>
  Effect.gen(function* () {
    const application = yield* Application;
    return handlers.handleAll({
      methods: () => application.auth.methods().pipe(mapInfrastructureError),
      start: Effect.fn("http.google.start")(function* ({ payload }) {
        const result = yield* application.auth.google
          .start(payload, yield* optionalSessionActor)
          .pipe(mapInfrastructureError);
        yield* googleFlowCookie.set(result.browserToken, result.expiresAt);
        return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
      }),
      callback: Effect.fn("http.google.callback")(function* ({ query }) {
        const browserToken = yield* googleFlowCookie.read;
        if (browserToken === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
        const input = yield* Schema.decodeUnknownEffect(GoogleCallbackInput)({
          ...query,
          browserToken: Redacted.value(browserToken),
        }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
        const result = yield* application.auth.google
          .callback(input, yield* optionalSessionActor)
          .pipe(mapInfrastructureError);
        yield* googleFlowCookie.clear;
        if (result.sessionToken !== undefined && result.sessionExpiresAt !== undefined)
          yield* setSessionCookie(result.sessionToken, result.sessionExpiresAt);
        return HttpServerResponse.empty({ status: 303, headers: { location: result.returnPath } });
      }),
    });
  }),
);
