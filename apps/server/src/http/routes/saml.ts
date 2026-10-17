import { Effect, Schema } from "effect";
import { HttpServerResponse } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { IdentityError, RequestError } from "@usepreface/protocol";
import { SamlCallbackInput } from "@usepreface/protocol/input";

import { samlFlowCookie } from "#/http/cookies/browser-proof";
import { setSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";
import { optionalSessionActor } from "#/http/routes/optional-actor";

export const SamlRoutes = HttpApiBuilder.group(PrefaceApi, "saml", (handlers) =>
  Effect.gen(function* () {
    const saml = (yield* Application).auth.saml;
    return handlers.handleAll({
      metadata: Effect.fn("http.saml.metadata")(function* ({ params }) {
        return yield* saml
          .metadata(params.organizationId, params.connectionId)
          .pipe(mapInfrastructureError);
      }),
      callback: Effect.fn("http.saml.callback")(function* ({ params, payload }) {
        const input = yield* Schema.decodeUnknownEffect(SamlCallbackInput)({
          response: payload.SAMLResponse,
          relayState: payload.RelayState,
        }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
        const result = yield* saml
          .callback(params.connectionId, input)
          .pipe(mapInfrastructureError);
        return HttpServerResponse.empty({
          status: 303,
          headers: { location: `/api/v1/auth/saml/complete?flowId=${result.flowId}` },
        });
      }),
      complete: Effect.fn("http.saml.complete")(function* ({ query }) {
        const browserToken = yield* samlFlowCookie.read;
        if (browserToken === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
        const result = yield* saml
          .complete({ flowId: query.flowId, browserToken }, yield* optionalSessionActor)
          .pipe(mapInfrastructureError);
        yield* samlFlowCookie.clear;
        if (result.sessionToken !== undefined && result.sessionExpiresAt !== undefined)
          yield* setSessionCookie(result.sessionToken, result.sessionExpiresAt);
        return HttpServerResponse.empty({ status: 303, headers: { location: result.returnPath } });
      }),
    });
  }),
);
