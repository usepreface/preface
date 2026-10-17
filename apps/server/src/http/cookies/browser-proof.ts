import { DateTime, Effect, Redacted, Schema } from "effect";
import { HttpEffect, HttpServerRequest, HttpServerResponse } from "effect/http";

import { SecretTokenFromString } from "@usepreface/protocol";

import { ServerConfig } from "#/config";

const browserProofCookie = (name: string) => ({
  read: Effect.gen(function* () {
    const raw = (yield* HttpServerRequest.HttpServerRequest).cookies[name];
    if (raw === undefined) return undefined;
    return yield* Schema.decodeUnknownEffect(SecretTokenFromString)(raw).pipe(
      Effect.catch(() => Effect.succeed(undefined)),
    );
  }),
  set: Effect.fn("http.setBrowserProofCookie")(function* (
    token: Redacted.Redacted<string>,
    expiresAt: DateTime.Utc,
  ) {
    const config = yield* ServerConfig;
    yield* HttpEffect.appendPreResponseHandler((_request, response) =>
      Effect.succeed(
        HttpServerResponse.setCookieUnsafe(response, name, Redacted.value(token), {
          httpOnly: true,
          secure: config.secureCookies,
          sameSite: "lax",
          path: "/",
          expires: DateTime.toDateUtc(expiresAt),
        }),
      ),
    );
  }),
  clear: Effect.gen(function* () {
    const config = yield* ServerConfig;
    yield* HttpEffect.appendPreResponseHandler((_request, response) =>
      Effect.succeed(
        HttpServerResponse.expireCookieUnsafe(response, name, {
          httpOnly: true,
          secure: config.secureCookies,
          sameSite: "lax",
          path: "/",
        }),
      ),
    );
  }),
});
export const googleFlowCookie = browserProofCookie("preface_google_flow");
export const emailReauthenticationCookie = browserProofCookie("preface_email_reauthentication");

export const oidcFlowCookie = browserProofCookie("preface_oidc_flow");
