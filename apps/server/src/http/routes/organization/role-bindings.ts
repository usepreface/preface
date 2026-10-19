import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";

export const OrganizationRoleBindingsRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationRoleBindings",
  (handlers) =>
    Effect.gen(function* () {
      const workflow = (yield* Application).organization.roleBinding;
      return handlers.handleAll({
        list: Effect.fn("http.organizationRoleBindings.list")(function* ({ query }) {
          return yield* workflow
            .list(yield* CurrentActor, yield* currentOrganizationId, query)
            .pipe(mapInfrastructureError);
        }),
        grant: Effect.fn("http.organizationRoleBindings.grant")(function* ({ payload }) {
          return yield* workflow
            .grant(yield* CurrentActor, yield* currentOrganizationId, payload)
            .pipe(mapInfrastructureError);
        }),
        revoke: Effect.fn("http.organizationRoleBindings.revoke")(function* ({ params }) {
          return yield* workflow
            .revoke(yield* CurrentActor, yield* currentOrganizationId, params.bindingId)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
