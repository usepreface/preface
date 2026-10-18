import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";

export const OrganizationRoleBindingsRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationRoleBindings",
  (handlers) =>
    Effect.gen(function* () {
      const workflow = (yield* Application).organization.roleBinding;
      return handlers.handleAll({
        list: Effect.fn("http.organizationRoleBindings.list")(function* ({ params, query }) {
          return yield* workflow
            .list(yield* CurrentActor, params.organizationId, query)
            .pipe(mapInfrastructureError);
        }),
        grant: Effect.fn("http.organizationRoleBindings.grant")(function* ({ params, payload }) {
          return yield* workflow
            .grant(yield* CurrentActor, params.organizationId, payload)
            .pipe(mapInfrastructureError);
        }),
        revoke: Effect.fn("http.organizationRoleBindings.revoke")(function* ({ params }) {
          return yield* workflow
            .revoke(yield* CurrentActor, params.organizationId, params.bindingId)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
