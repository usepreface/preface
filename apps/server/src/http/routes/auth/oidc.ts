import { Effect, Redacted, Schema } from "effect";
import { HttpServerResponse } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { IdentityError, RequestError } from "@usepreface/protocol";
import { ExternalIdentityCallbackInput } from "@usepreface/protocol/input";

import { oidcFlowCookie, samlFlowCookie } from "#/http/cookies/browser-proof";
import { setSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";
import { optionalSessionActor } from "#/http/routes/auth/optional-actor";

export const OidcRoutes = HttpApiBuilder.group(PrefaceApi, "oidc", (handlers) =>
  Effect.gen(function* () {
    const application = yield* Application;
    return handlers.handleAll({
      start: Effect.fn("http.oidc.start")(function* ({ params, payload }) {
        const result = yield* application.organization.identityConnection
          .startSignIn(
            params.organizationId,
            params.connectionId,
            payload,
            yield* optionalSessionActor,
          )
          .pipe(mapInfrastructureError);
        yield* (result.provider === "saml" ? samlFlowCookie : oidcFlowCookie).set(
          result.browserToken,
          result.expiresAt,
        );
        return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
      }),
      callback: Effect.fn("http.oidc.callback")(function* ({ query }) {
        const browserToken = yield* oidcFlowCookie.read;
        if (browserToken === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
        const input = yield* Schema.decodeUnknownEffect(ExternalIdentityCallbackInput)({
          ...query,
          browserToken: Redacted.value(browserToken),
        }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
        const result = yield* application.auth.oidc
          .callback(input, yield* optionalSessionActor)
          .pipe(mapInfrastructureError);
        yield* oidcFlowCookie.clear;
        if (result.sessionToken !== undefined && result.sessionExpiresAt !== undefined)
          yield* setSessionCookie(result.sessionToken, result.sessionExpiresAt);
        return HttpServerResponse.empty({ status: 303, headers: { location: result.returnPath } });
      }),
    });
  }),
);
