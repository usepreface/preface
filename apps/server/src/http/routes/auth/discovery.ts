import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";
export const AuthenticationDiscoveryRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "authenticationDiscovery",
  (handlers) =>
    Effect.gen(function* () {
      const application = yield* Application;
      return handlers.handle(
        "discover",
        Effect.fn("http.authentication.discover")(function* () {
          return yield* application.auth.discover().pipe(mapInfrastructureError);
        }),
      );
    }),
);
export const CurrentOrganizationAuthenticationRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "currentOrganizationAuthentication",
  (handlers) =>
    Effect.gen(function* () {
      const application = yield* Application;
      return handlers.handle(
        "get",
        Effect.fn("http.authentication.currentAccess")(function* () {
          const authentication = yield* application.organization.authPolicy
            .methods(yield* CurrentActor, yield* currentOrganizationId)
            .pipe(mapInfrastructureError);
          return { authentication };
        }),
      );
    }),
);
