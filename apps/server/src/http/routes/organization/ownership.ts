import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";

export const OrganizationOwnershipRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationOwnership",
  (handlers) =>
    Effect.gen(function* () {
      const workflow = (yield* Application).organization.ownership;
      return handlers.handleAll({
        grant: Effect.fn("http.organizationOwnership.grant")(function* ({ params }) {
          return yield* workflow
            .grant(yield* CurrentActor, yield* currentOrganizationId, params.memberId)
            .pipe(mapInfrastructureError);
        }),
        revoke: Effect.fn("http.organizationOwnership.revoke")(function* ({ params }) {
          return yield* workflow
            .revoke(yield* CurrentActor, yield* currentOrganizationId, params.memberId)
            .pipe(mapInfrastructureError);
        }),
        transfer: Effect.fn("http.organizationOwnership.transfer")(function* ({ payload }) {
          return yield* workflow
            .transfer(yield* CurrentActor, yield* currentOrganizationId, payload.targetMemberId)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
