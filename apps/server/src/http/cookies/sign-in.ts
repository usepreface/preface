import { DateTime, Effect, Redacted, Schema } from "effect";
import { HttpEffect, HttpServerRequest, HttpServerResponse } from "effect/http";

import { SecretTokenFromString } from "@usepreface/protocol";

import { ServerConfig } from "#/config";

export const signInCookieName = "preface_sign_in";
export const readSignInCookie = Effect.gen(function* () {
  const raw = (yield* HttpServerRequest.HttpServerRequest).cookies[signInCookieName];
  if (raw === undefined) return undefined;
  return yield* Schema.decodeUnknownEffect(SecretTokenFromString)(raw).pipe(
    Effect.catch(() => Effect.succeed(undefined)),
  );
});
export const setSignInCookie = Effect.fn("http.setSignInCookie")(function* (
  token: Redacted.Redacted<string>,
  expiresAt: DateTime.Utc,
) {
  const config = yield* ServerConfig;
  yield* HttpEffect.appendPreResponseHandler((_request, response) =>
    Effect.succeed(
      HttpServerResponse.setCookieUnsafe(response, signInCookieName, Redacted.value(token), {
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: "lax",
        path: "/",
        expires: DateTime.toDateUtc(expiresAt),
      }),
    ),
  );
});
export const clearSignInCookie = Effect.gen(function* () {
  const config = yield* ServerConfig;
  yield* HttpEffect.appendPreResponseHandler((_request, response) =>
    Effect.succeed(
      HttpServerResponse.expireCookieUnsafe(response, signInCookieName, {
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: "lax",
        path: "/",
      }),
    ),
  );
});
