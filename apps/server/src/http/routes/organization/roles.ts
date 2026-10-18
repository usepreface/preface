import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import {
  CreateOrganizationRoleInput,
  UpdateOrganizationRoleInput,
} from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";

export const OrganizationRolesRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationRoles",
  (handlers) =>
    Effect.gen(function* () {
      const roles = (yield* Application).organization.role;
      return handlers.handleAll({
        list: Effect.fn("http.organizationRoles.list")(function* ({ params, query }) {
          return yield* roles
            .list(yield* CurrentActor, params.organizationId, query)
            .pipe(mapInfrastructureError);
        }),
        create: Effect.fn("http.organizationRoles.create")(function* ({ params, payload }) {
          const input = yield* Schema.decodeUnknownEffect(CreateOrganizationRoleInput)(
            payload,
          ).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          return yield* roles
            .create(yield* CurrentActor, params.organizationId, input)
            .pipe(mapInfrastructureError);
        }),
        update: Effect.fn("http.organizationRoles.update")(function* ({ params, payload }) {
          const input = yield* Schema.decodeUnknownEffect(UpdateOrganizationRoleInput)(
            payload,
          ).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          return yield* roles
            .update(yield* CurrentActor, params.organizationId, params.roleId, input)
            .pipe(mapInfrastructureError);
        }),
        archive: Effect.fn("http.organizationRoles.archive")(function* ({ params }) {
          return yield* roles
            .archive(yield* CurrentActor, params.organizationId, params.roleId)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
