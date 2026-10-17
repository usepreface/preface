import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { CreateOrganizationInput, UpdateOrganizationInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";

export const OrganizationsRoutes = HttpApiBuilder.group(PrefaceApi, "organizations", (handlers) =>
  Effect.gen(function* () {
    const application = (yield* Application).organization;
    return handlers.handleAll({
      create: Effect.fn("http.organizations.create")(function* ({ payload }) {
        const input = yield* Schema.decodeUnknownEffect(CreateOrganizationInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* application.organization
          .create(yield* CurrentActor, input)
          .pipe(mapInfrastructureError);
      }),
      list: Effect.fn("http.organizations.list")(function* ({ query }) {
        return yield* application.organization
          .listMine(yield* CurrentActor, query)
          .pipe(mapInfrastructureError);
      }),
      get: Effect.fn("http.organizations.get")(function* ({ params }) {
        return yield* application.organization
          .get(yield* CurrentActor, params.organizationId)
          .pipe(mapInfrastructureError);
      }),
      access: Effect.fn("http.organizations.access")(function* ({ params }) {
        return yield* application.organization
          .getAccess(yield* CurrentActor, params.organizationId)
          .pipe(mapInfrastructureError);
      }),
      update: Effect.fn("http.organizations.update")(function* ({ params, payload }) {
        const input = yield* Schema.decodeUnknownEffect(UpdateOrganizationInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* application.organization
          .update(yield* CurrentActor, params.organizationId, input)
          .pipe(mapInfrastructureError);
      }),
      archive: Effect.fn("http.organizations.archive")(function* ({ params }) {
        return yield* application.organization
          .archive(yield* CurrentActor, params.organizationId)
          .pipe(mapInfrastructureError);
      }),
      restore: Effect.fn("http.organizations.restore")(function* ({ params }) {
        return yield* application.organization
          .restore(yield* CurrentActor, params.organizationId)
          .pipe(mapInfrastructureError);
      }),
      authPolicy: Effect.fn("http.organizations.authPolicy")(function* ({ params }) {
        return yield* application.authPolicy
          .get(yield* CurrentActor, params.organizationId)
          .pipe(mapInfrastructureError);
      }),
    });
  }),
);
export const InstanceCapabilitiesRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "instanceCapabilities",
  (handlers) =>
    Effect.gen(function* () {
      const capabilities = (yield* Application).instance.capabilities;
      return handlers.handle(
        "get",
        Effect.fn("http.instanceCapabilities.get")(function* () {
          return yield* capabilities.get(yield* CurrentActor).pipe(mapInfrastructureError);
        }),
      );
    }),
);
