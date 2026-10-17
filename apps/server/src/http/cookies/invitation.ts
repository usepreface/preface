import { DateTime, Effect, Redacted, Schema } from "effect";
import { HttpEffect, HttpServerRequest, HttpServerResponse } from "effect/http";

import { SecretTokenFromString } from "@usepreface/protocol";

import { ServerConfig } from "#/config";

export const invitationCookieName = "preface_invitation";
export const readInvitationCookie = Effect.gen(function* () {
  const raw = (yield* HttpServerRequest.HttpServerRequest).cookies[invitationCookieName];
  if (raw === undefined) return undefined;
  return yield* Schema.decodeUnknownEffect(SecretTokenFromString)(raw).pipe(
    Effect.catch(() => Effect.succeed(undefined)),
  );
});
export const setInvitationCookie = Effect.fn("http.setInvitationCookie")(function* (
  token: Redacted.Redacted<string>,
  expiresAt: DateTime.Utc,
) {
  const config = yield* ServerConfig;
  yield* HttpEffect.appendPreResponseHandler((_request, response) =>
    Effect.succeed(
      HttpServerResponse.setCookieUnsafe(response, invitationCookieName, Redacted.value(token), {
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: "lax",
        path: "/",
        expires: DateTime.toDateUtc(expiresAt),
      }),
    ),
  );
});
export const clearInvitationCookie = Effect.gen(function* () {
  const config = yield* ServerConfig;
  yield* HttpEffect.appendPreResponseHandler((_request, response) =>
    Effect.succeed(
      HttpServerResponse.expireCookieUnsafe(response, invitationCookieName, {
        httpOnly: true,
        secure: config.secureCookies,
        sameSite: "lax",
        path: "/",
      }),
    ),
  );
});
