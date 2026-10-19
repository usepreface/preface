import { Effect } from "effect";

import { Application } from "@usepreface/application";

import { mapInfrastructureError } from "#/http/errors";

export const currentOrganizationId = Effect.gen(function* () {
  const application = yield* Application;
  return yield* application.organization.organization.currentId().pipe(mapInfrastructureError);
});
