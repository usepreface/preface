import { DateTime, Effect, Redacted, Schema } from "effect";
import { HttpEffect, HttpServerRequest, HttpServerResponse } from "effect/http";

import { sessionCookieName } from "@usepreface/api";
import { SecretTokenFromString } from "@usepreface/protocol";

import { ServerConfig } from "#/config";

export const readSessionCookie = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const raw = request.cookies[sessionCookieName];
  if (raw === undefined) return undefined;
  return yield* Schema.decodeUnknownEffect(SecretTokenFromString)(raw).pipe(
    Effect.catch(() => Effect.succeed(undefined)),
  );
});

export const setSessionCookie = Effect.fn("http.setSessionCookie")(function* (
  token: Redacted.Redacted<string>,
  expiresAt: DateTime.Utc,
) {
  const config = yield* ServerConfig;
  yield* HttpEffect.appendPreResponseHandler((_request, response) =>
    Effect.succeed(
      HttpServerResponse.setCookieUnsafe(response, sessionCookieName, Redacted.value(token), {
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: "lax",
        path: "/",
        expires: DateTime.toDateUtc(expiresAt),
      }),
    ),
  );
});

export const clearSessionCookie = Effect.gen(function* () {
  const config = yield* ServerConfig;
  yield* HttpEffect.appendPreResponseHandler((_request, response) =>
    Effect.succeed(
      HttpServerResponse.expireCookieUnsafe(response, sessionCookieName, {
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: "lax",
        path: "/",
      }),
    ),
  );
});
