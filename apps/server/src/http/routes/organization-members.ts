import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";

export const OrganizationMembersRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationMembers",
  (handlers) =>
    Effect.gen(function* () {
      const workflow = (yield* Application).organization.member;
      return handlers.handleAll({
        list: Effect.fn("http.organizationMembers.list")(function* ({ params, query }) {
          return yield* workflow
            .list(yield* CurrentActor, params.organizationId, query)
            .pipe(mapInfrastructureError);
        }),
        suspend: Effect.fn("http.organizationMembers.suspend")(function* ({ params }) {
          return yield* workflow
            .suspend(yield* CurrentActor, params.organizationId, params.memberId)
            .pipe(mapInfrastructureError);
        }),
        reinstate: Effect.fn("http.organizationMembers.reinstate")(function* ({ params }) {
          return yield* workflow
            .reinstate(yield* CurrentActor, params.organizationId, params.memberId)
            .pipe(mapInfrastructureError);
        }),
        remove: Effect.fn("http.organizationMembers.remove")(function* ({ params }) {
          return yield* workflow
            .remove(yield* CurrentActor, params.organizationId, params.memberId)
            .pipe(mapInfrastructureError);
        }),
        leave: Effect.fn("http.organizationMembers.leave")(function* ({ params }) {
          return yield* workflow
            .leave(yield* CurrentActor, params.organizationId)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
