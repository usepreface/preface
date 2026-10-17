import { Effect, Redacted, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { EmailSignInError, RequestError } from "@usepreface/protocol";
import {
  RequestEmailSignInInput,
  ResendEmailSignInInput,
  VerifyEmailSignInInput,
} from "@usepreface/protocol/input";

import { readSessionCookie, setSessionCookie } from "#/http/cookies/session";
import { readSignInCookie, setSignInCookie, clearSignInCookie } from "#/http/cookies/sign-in";
import { mapInfrastructureError } from "#/http/errors";

export const EmailSignInRoutes = HttpApiBuilder.group(PrefaceApi, "emailSignIn", (handlers) =>
  Effect.gen(function* () {
    const application = yield* Application;
    const requireSignedOut = Effect.gen(function* () {
      const token = yield* readSessionCookie;
      if (token === undefined) return;
      const actor = yield* application.auth.session.resolve(token).pipe(
        Effect.catchTag("AuthenticationError", () => Effect.succeed(undefined)),
        mapInfrastructureError,
      );
      if (actor !== undefined)
        return yield* new EmailSignInError({ code: "ALREADY_AUTHENTICATED" });
    });
    return handlers.handleAll({
      request: Effect.fn("http.emailSignIn.request")(function* ({ payload }) {
        yield* requireSignedOut;
        const input = yield* Schema.decodeUnknownEffect(RequestEmailSignInInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        const result = yield* application.auth.emailSignIn
          .request(input)
          .pipe(mapInfrastructureError);
        yield* setSignInCookie(result.browserToken, result.challenge.expiresAt);
        return result.challenge;
      }),
      resend: Effect.fn("http.emailSignIn.resend")(function* ({ payload }) {
        yield* requireSignedOut;
        const browserToken = yield* readSignInCookie;
        if (browserToken === undefined)
          return yield* new EmailSignInError({ code: "INVALID_PROOF" });
        const input = yield* Schema.decodeUnknownEffect(ResendEmailSignInInput)({
          ...payload,
          browserToken: Redacted.value(browserToken),
        }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
        const result = yield* application.auth.emailSignIn
          .resend(input)
          .pipe(mapInfrastructureError);
        yield* setSignInCookie(result.browserToken, result.challenge.expiresAt);
        return result.challenge;
      }),
      verify: Effect.fn("http.emailSignIn.verify")(function* ({ payload }) {
        yield* requireSignedOut;
        const browserToken = yield* readSignInCookie;
        if (browserToken === undefined)
          return yield* new EmailSignInError({ code: "INVALID_PROOF" });
        const input = yield* Schema.decodeUnknownEffect(VerifyEmailSignInInput)({
          ...payload,
          browserToken: Redacted.value(browserToken),
        }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
        const result = yield* application.auth.emailSignIn
          .verify(input)
          .pipe(mapInfrastructureError);
        yield* setSessionCookie(result.sessionToken, result.actor.session.expiresAt);
        yield* clearSignInCookie;
        return result.actor;
      }),
    });
  }),
);
