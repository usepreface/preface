import { Effect, Redacted, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { CreateDomainInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";

export const OrganizationDomainsRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationDomains",
  (handlers) =>
    Effect.gen(function* () {
      const domains = (yield* Application).organization.domain;
      return handlers.handleAll({
        list: Effect.fn("http.domains.list")(function* ({ params }) {
          return yield* domains
            .list(yield* CurrentActor, params.organizationId)
            .pipe(mapInfrastructureError);
        }),
        create: Effect.fn("http.domains.create")(function* ({ params, payload }) {
          const input = yield* Schema.decodeUnknownEffect(CreateDomainInput)(payload).pipe(
            Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
          );
          return yield* domains
            .create(yield* CurrentActor, params.organizationId, input)
            .pipe(mapInfrastructureError);
        }),
        request: Effect.fn("http.domains.request")(function* ({ params, payload }) {
          const result = yield* domains
            .request(
              yield* CurrentActor,
              params.organizationId,
              params.domainId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
          return {
            domain: result.domain,
            recordName: result.recordName,
            recordValue: Redacted.value(result.token),
            expiresAt: result.expiresAt,
          };
        }),
        verify: Effect.fn("http.domains.verify")(function* ({ params, payload }) {
          return yield* domains
            .verify(
              yield* CurrentActor,
              params.organizationId,
              params.domainId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
        approve: Effect.fn("http.domains.approve")(function* ({ params, payload }) {
          return yield* domains
            .verify(
              yield* CurrentActor,
              params.organizationId,
              params.domainId,
              payload.expectedRevision,
              "operator",
            )
            .pipe(mapInfrastructureError);
        }),
        revoke: Effect.fn("http.domains.revoke")(function* ({ params, payload }) {
          return yield* domains
            .revoke(
              yield* CurrentActor,
              params.organizationId,
              params.domainId,
              payload.expectedRevision,
            )
            .pipe(mapInfrastructureError);
        }),
        connectionDomains: Effect.fn("http.domains.connectionDomains")(function* ({ params }) {
          return yield* domains
            .connectionDomains(yield* CurrentActor, params.organizationId, params.connectionId)
            .pipe(mapInfrastructureError);
        }),
        bind: Effect.fn("http.domains.bind")(function* ({ params, payload }) {
          return yield* domains
            .bind(yield* CurrentActor, params.organizationId, params.connectionId, payload)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
