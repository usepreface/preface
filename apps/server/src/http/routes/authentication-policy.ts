import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";
export const AuthenticationPolicyRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "authenticationPolicy",
  (handlers) =>
    Effect.gen(function* () {
      const policy = (yield* Application).organization.authPolicy;
      return handlers.handleAll({
        methods: Effect.fn("http.authenticationPolicy.methods")(function* ({ params }) {
          return yield* policy
            .methods(yield* CurrentActor, params.organizationId)
            .pipe(mapInfrastructureError);
        }),
        update: Effect.fn("http.authenticationPolicy.update")(function* ({ params, payload }) {
          return yield* policy
            .update(yield* CurrentActor, params.organizationId, payload)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
