import { Effect, Redacted, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { RecoverOrganizationAuthInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";

export const OrganizationAuthRecoveryRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationAuthRecovery",
  (handlers) =>
    Effect.gen(function* () {
      const recovery = (yield* Application).organization.authRecovery;
      return handlers.handleAll({
        get: Effect.fn("http.organizationAuthRecovery.get")(function* ({ params }) {
          return yield* recovery
            .get(yield* CurrentActor, params.organizationId)
            .pipe(mapInfrastructureError);
        }),
        rotate: Effect.fn("http.organizationAuthRecovery.rotate")(function* ({ params }) {
          const result = yield* recovery
            .rotate(yield* CurrentActor, params.organizationId)
            .pipe(mapInfrastructureError);
          return { ...result, recoveryCredential: Redacted.value(result.recoveryCredential) };
        }),
        revoke: Effect.fn("http.organizationAuthRecovery.revoke")(function* ({ params }) {
          yield* recovery
            .revoke(yield* CurrentActor, params.organizationId)
            .pipe(mapInfrastructureError);
        }),
        recover: Effect.fn("http.organizationAuthRecovery.recover")(function* ({
          params,
          payload,
        }) {
          const input = yield* Schema.decodeUnknownEffect(RecoverOrganizationAuthInput)(
            payload,
          ).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
          return yield* recovery
            .recover(yield* CurrentActor, params.organizationId, input)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
