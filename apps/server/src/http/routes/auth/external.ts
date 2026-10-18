import { Effect, Redacted, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { IdentityError, RequestError } from "@usepreface/protocol";
import {
  InvitationAuthenticationInput,
  VerifyExternalEmailInput,
} from "@usepreface/protocol/input";

import {
  externalFlowCookie,
  googleFlowCookie,
  oidcFlowCookie,
  samlFlowCookie,
} from "#/http/cookies/browser-proof";
import { mapInfrastructureError } from "#/http/errors";
import { deliverExternalCompletion } from "#/http/routes/auth/completion";
import { optionalSessionActor } from "#/http/routes/auth/optional-actor";

const requireBrowser = Effect.gen(function* () {
  const browser = yield* externalFlowCookie.read;
  if (browser === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
  return browser;
});

export const ExternalAuthenticationRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "externalAuthentication",
  (handlers) =>
    Effect.gen(function* () {
      const external = (yield* Application).auth.external;
      return handlers.handleAll({
        startInvitation: Effect.fn("http.authentication.startInvitation")(function* ({ payload }) {
          const input = yield* Schema.decodeUnknownEffect(InvitationAuthenticationInput)(
            payload,
          ).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          const result = yield* external.invitation
            .start(input, yield* optionalSessionActor)
            .pipe(mapInfrastructureError);
          yield* (
            result.provider === "google"
              ? googleFlowCookie
              : result.provider === "oidc"
                ? oidcFlowCookie
                : samlFlowCookie
          ).set(result.browserToken, result.expiresAt);
          return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
        }),
        status: Effect.fn("http.authentication.status")(function* ({ params }) {
          return yield* external
            .status(
              { flowId: params.flowId, browserToken: yield* requireBrowser },
              yield* optionalSessionActor,
            )
            .pipe(mapInfrastructureError);
        }),
        requestEmail: Effect.fn("http.authentication.requestEmail")(function* ({ params }) {
          return yield* external
            .request(
              { flowId: params.flowId, browserToken: yield* requireBrowser },
              yield* optionalSessionActor,
            )
            .pipe(mapInfrastructureError);
        }),
        verifyEmail: Effect.fn("http.authentication.verifyEmail")(function* ({ params, payload }) {
          const browserToken = yield* requireBrowser;
          const input = yield* Schema.decodeUnknownEffect(VerifyExternalEmailInput)({
            ...params,
            ...payload,
            browserToken: Redacted.value(browserToken),
          }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          const result = yield* external
            .verify(input, yield* optionalSessionActor)
            .pipe(mapInfrastructureError);
          return yield* deliverExternalCompletion(result, browserToken);
        }),
        resume: Effect.fn("http.authentication.resume")(function* ({ params }) {
          const browserToken = yield* requireBrowser;
          const result = yield* external
            .resume({ ...params, browserToken }, yield* optionalSessionActor)
            .pipe(mapInfrastructureError);
          return yield* deliverExternalCompletion(result, browserToken);
        }),
      });
    }),
);
