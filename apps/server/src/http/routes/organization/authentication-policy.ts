import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { UpdateOrganizationAuthPolicyInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";
export const AuthenticationPolicyRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "authenticationPolicy",
  (handlers) =>
    Effect.gen(function* () {
      const policy = (yield* Application).organization.authPolicy;
      return handlers.handleAll({
        methods: Effect.fn("http.authenticationPolicy.methods")(function* () {
          return yield* policy
            .methods(yield* CurrentActor, yield* currentOrganizationId)
            .pipe(mapInfrastructureError);
        }),
        readiness: Effect.fn("http.authenticationPolicy.readiness")(function* () {
          return yield* policy
            .readiness(yield* CurrentActor, yield* currentOrganizationId)
            .pipe(mapInfrastructureError);
        }),
        update: Effect.fn("http.authenticationPolicy.update")(function* ({ payload }) {
          const input = yield* Schema.decodeUnknownEffect(UpdateOrganizationAuthPolicyInput)(
            payload,
          ).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          return yield* policy
            .update(yield* CurrentActor, yield* currentOrganizationId, input)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
