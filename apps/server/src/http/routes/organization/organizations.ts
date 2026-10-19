import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { UpdateOrganizationInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";

export const OrganizationsRoutes = HttpApiBuilder.group(PrefaceApi, "organizations", (handlers) =>
  Effect.gen(function* () {
    const application = (yield* Application).organization;
    return handlers.handleAll({
      get: Effect.fn("http.organizations.get")(function* () {
        return yield* application.organization
          .get(yield* CurrentActor, yield* currentOrganizationId)
          .pipe(mapInfrastructureError);
      }),
      access: Effect.fn("http.organizations.access")(function* () {
        return yield* application.organization
          .getAccess(yield* CurrentActor, yield* currentOrganizationId)
          .pipe(mapInfrastructureError);
      }),
      update: Effect.fn("http.organizations.update")(function* ({ payload }) {
        const input = yield* Schema.decodeUnknownEffect(UpdateOrganizationInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* application.organization
          .update(yield* CurrentActor, yield* currentOrganizationId, input)
          .pipe(mapInfrastructureError);
      }),
      authPolicy: Effect.fn("http.organizations.authPolicy")(function* () {
        return yield* application.authPolicy
          .get(yield* CurrentActor, yield* currentOrganizationId)
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
