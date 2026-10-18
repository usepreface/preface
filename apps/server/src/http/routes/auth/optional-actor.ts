import { Effect } from "effect";

import { Application } from "@usepreface/application";

import { readSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";

export const optionalSessionActor = Effect.gen(function* () {
  const token = yield* readSessionCookie;
  if (token === undefined) return undefined;
  return yield* (yield* Application).auth.session.resolve(token).pipe(
    Effect.catchTag("AuthenticationError", () => Effect.succeed(undefined)),
    mapInfrastructureError,
  );
});
