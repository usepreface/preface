import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";

export const OrganizationMembersRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationMembers",
  (handlers) =>
    Effect.gen(function* () {
      const workflow = (yield* Application).organization.member;
      return handlers.handleAll({
        list: Effect.fn("http.organizationMembers.list")(function* ({ query }) {
          return yield* workflow
            .list(yield* CurrentActor, yield* currentOrganizationId, query)
            .pipe(mapInfrastructureError);
        }),
        suspend: Effect.fn("http.organizationMembers.suspend")(function* ({ params }) {
          return yield* workflow
            .suspend(yield* CurrentActor, yield* currentOrganizationId, params.memberId)
            .pipe(mapInfrastructureError);
        }),
        reinstate: Effect.fn("http.organizationMembers.reinstate")(function* ({ params }) {
          return yield* workflow
            .reinstate(yield* CurrentActor, yield* currentOrganizationId, params.memberId)
            .pipe(mapInfrastructureError);
        }),
        remove: Effect.fn("http.organizationMembers.remove")(function* ({ params }) {
          return yield* workflow
            .remove(yield* CurrentActor, yield* currentOrganizationId, params.memberId)
            .pipe(mapInfrastructureError);
        }),
        leave: Effect.fn("http.organizationMembers.leave")(function* () {
          return yield* workflow
            .leave(yield* CurrentActor, yield* currentOrganizationId)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
