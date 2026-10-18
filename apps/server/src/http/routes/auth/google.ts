import { Effect, Redacted, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { IdentityError, RequestError } from "@usepreface/protocol";
import { GoogleCallbackInput } from "@usepreface/protocol/input";

import { googleFlowCookie } from "#/http/cookies/browser-proof";
import { mapInfrastructureError } from "#/http/errors";
import {
  externalCallbackResponse,
  authenticationFailureRedirect,
} from "#/http/routes/auth/completion";
import { optionalSessionActor } from "#/http/routes/auth/optional-actor";

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
        return yield* externalCallbackResponse(result, browserToken);
      }, authenticationFailureRedirect(googleFlowCookie)),
    });
  }),
);
