import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { UpdateOrganizationAuthPolicyInput } from "@usepreface/protocol/input";

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
        readiness: Effect.fn("http.authenticationPolicy.readiness")(function* ({ params }) {
          return yield* policy
            .readiness(yield* CurrentActor, params.organizationId)
            .pipe(mapInfrastructureError);
        }),
        update: Effect.fn("http.authenticationPolicy.update")(function* ({ params, payload }) {
          const input = yield* Schema.decodeUnknownEffect(UpdateOrganizationAuthPolicyInput)(
            payload,
          ).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          return yield* policy
            .update(yield* CurrentActor, params.organizationId, input)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
