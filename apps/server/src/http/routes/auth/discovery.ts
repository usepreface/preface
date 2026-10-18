import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { AuthenticationDiscoveryInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";

export const AuthenticationDiscoveryRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "authenticationDiscovery",
  (handlers) =>
    Effect.gen(function* () {
      const application = yield* Application;
      return handlers.handle(
        "discover",
        Effect.fn("http.authentication.discover")(function* ({ payload }) {
          const input = yield* Schema.decodeUnknownEffect(AuthenticationDiscoveryInput)(
            payload,
          ).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          return yield* application.auth.discover(input).pipe(mapInfrastructureError);
        }),
      );
    }),
);

export const OrganizationSelectionRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationSelection",
  (handlers) =>
    Effect.gen(function* () {
      const application = yield* Application;
      return handlers.handle(
        "select",
        Effect.fn("http.authentication.selectOrganization")(function* ({ params }) {
          const authentication = yield* application.organization.authPolicy
            .methods(yield* CurrentActor, params.organizationId)
            .pipe(mapInfrastructureError);
          return { organizationId: params.organizationId, authentication };
        }),
      );
    }),
);
