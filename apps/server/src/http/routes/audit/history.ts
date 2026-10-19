import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";

export const AuditRoutes = HttpApiBuilder.group(PrefaceApi, "audit", (handlers) =>
  Effect.gen(function* () {
    const audit = (yield* Application).audit;
    return handlers.handleAll({
      organization: Effect.fn("http.audit.organization")(function* ({ query }) {
        return yield* audit
          .list(yield* CurrentActor, yield* currentOrganizationId, query)
          .pipe(mapInfrastructureError);
      }),
      instance: Effect.fn("http.audit.instance")(function* ({ query }) {
        return yield* audit.list(yield* CurrentActor, null, query).pipe(mapInfrastructureError);
      }),
      exportOrganization: Effect.fn("http.audit.exportOrganization")(function* ({ query }) {
        return yield* audit
          .exportCsv(yield* CurrentActor, yield* currentOrganizationId, query)
          .pipe(mapInfrastructureError);
      }),
      exportInstance: Effect.fn("http.audit.exportInstance")(function* ({ query }) {
        return yield* audit
          .exportCsv(yield* CurrentActor, null, query)
          .pipe(mapInfrastructureError);
      }),
    });
  }),
);
