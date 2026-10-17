import { Effect } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/http";

import { checkDatabaseConnection } from "@usepreface/database";

import { requestErrorResponse } from "#/http/errors";

export const HealthRoutes = HttpRouter.use(
  Effect.fnUntraced(function* (router) {
    yield* router.add("GET", "/health/live", HttpServerResponse.jsonUnsafe({ status: "ok" }));
    yield* router.add(
      "GET",
      "/health/ready",
      checkDatabaseConnection().pipe(
        Effect.as(HttpServerResponse.jsonUnsafe({ status: "ready" })),
        Effect.catchTag("DatabaseError", () =>
          Effect.succeed(requestErrorResponse("SERVICE_UNAVAILABLE")),
        ),
        Effect.timeoutOrElse({
          duration: "2 seconds",
          orElse: () => Effect.succeed(requestErrorResponse("SERVICE_UNAVAILABLE")),
        }),
      ),
    );
  }),
);
