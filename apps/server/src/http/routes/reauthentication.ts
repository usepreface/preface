import { Effect, Redacted, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { IdentityError, RequestError } from "@usepreface/protocol";
import { ResendEmailSignInInput, VerifyEmailSignInInput } from "@usepreface/protocol/input";

import { googleFlowCookie, emailReauthenticationCookie } from "#/http/cookies/browser-proof";
import { mapInfrastructureError } from "#/http/errors";
export const ReauthenticationRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "reauthentication",
  (handlers) =>
    Effect.gen(function* () {
      const reauthentication = (yield* Application).auth.reauthentication;
      return handlers.handleAll({
        requestEmail: Effect.fn("http.reauthentication.requestEmail")(function* () {
          const result = yield* reauthentication.email
            .request(yield* CurrentActor)
            .pipe(mapInfrastructureError);
          yield* emailReauthenticationCookie.set(result.browserToken, result.challenge.expiresAt);
          return result.challenge;
        }),
        resendEmail: Effect.fn("http.reauthentication.resendEmail")(function* ({ payload }) {
          const browserToken = yield* emailReauthenticationCookie.read;
          if (browserToken === undefined)
            return yield* new IdentityError({ code: "INVALID_PROOF" });
          const input = yield* Schema.decodeUnknownEffect(ResendEmailSignInInput)({
            ...payload,
            browserToken: Redacted.value(browserToken),
          }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          const result = yield* reauthentication.email
            .resend(yield* CurrentActor, input)
            .pipe(mapInfrastructureError);
          yield* emailReauthenticationCookie.set(result.browserToken, result.challenge.expiresAt);
          return result.challenge;
        }),
        verifyEmail: Effect.fn("http.reauthentication.verifyEmail")(function* ({ payload }) {
          const browserToken = yield* emailReauthenticationCookie.read;
          if (browserToken === undefined)
            return yield* new IdentityError({ code: "INVALID_PROOF" });
          const input = yield* Schema.decodeUnknownEffect(VerifyEmailSignInInput)({
            ...payload,
            browserToken: Redacted.value(browserToken),
          }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          yield* reauthentication.email
            .verify(yield* CurrentActor, input)
            .pipe(mapInfrastructureError);
          yield* emailReauthenticationCookie.clear;
        }),
        startGoogle: Effect.fn("http.reauthentication.startGoogle")(function* ({ payload }) {
          const result = yield* reauthentication
            .google(yield* CurrentActor, payload)
            .pipe(mapInfrastructureError);
          yield* googleFlowCookie.set(result.browserToken, result.expiresAt);
          return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
        }),
      });
    }),
);
