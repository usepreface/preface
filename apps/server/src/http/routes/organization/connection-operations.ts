import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { samlFlowCookie } from "#/http/cookies/browser-proof";
import { mapInfrastructureError } from "#/http/errors";
export const ConnectionOperationsRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "connectionOperations",
  (handlers) =>
    Effect.gen(function* () {
      const connections = (yield* Application).organization.identityConnection;
      return handlers.handleAll({
        health: Effect.fn("http.connectionOperations.health")(function* ({ params }) {
          return yield* connections
            .health(yield* CurrentActor, params.organizationId, params.connectionId)
            .pipe(mapInfrastructureError);
        }),
        keys: Effect.fn("http.connectionOperations.keys")(function* ({ params }) {
          return yield* connections.keys
            .list(yield* CurrentActor, params.organizationId, params.connectionId)
            .pipe(mapInfrastructureError);
        }),
        prepare: Effect.fn("http.connectionOperations.prepare")(function* ({ params, payload }) {
          return yield* connections.keys
            .prepare(
              yield* CurrentActor,
              params.organizationId,
              params.connectionId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
        test: Effect.fn("http.connectionOperations.test")(function* ({ params, payload }) {
          const result = yield* connections.keys
            .test(
              yield* CurrentActor,
              params.organizationId,
              params.connectionId,
              params.keyId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
          yield* samlFlowCookie.set(result.browserToken, result.expiresAt);
          return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
        }),
        activate: Effect.fn("http.connectionOperations.activate")(function* ({ params, payload }) {
          return yield* connections.keys
            .activate(
              yield* CurrentActor,
              params.organizationId,
              params.connectionId,
              params.keyId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
        retire: Effect.fn("http.connectionOperations.retire")(function* ({ params, payload }) {
          return yield* connections.keys
            .retire(
              yield* CurrentActor,
              params.organizationId,
              params.connectionId,
              params.keyId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
