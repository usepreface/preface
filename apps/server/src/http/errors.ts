import { Cause, Effect, Predicate } from "effect";
import { HttpServerError, HttpServerResponse } from "effect/http";
import { HttpApiError } from "effect/http-api";

import { requestErrorStatuses } from "@usepreface/api";
import { DatabaseError } from "@usepreface/database";
import { RequestError } from "@usepreface/protocol";
import type { RequestErrorCode } from "@usepreface/protocol";

export const requestErrorResponse = (code: RequestErrorCode) =>
  HttpServerResponse.jsonUnsafe(new RequestError({ code }), { status: requestErrorStatuses[code] });

export const mapInfrastructureError = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(
    Effect.catchIf(
      (
        error,
      ): error is Extract<
        E,
        { readonly _tag: "DatabaseError" | "SecurityError" | "InstanceStateError" }
      > =>
        Predicate.isTagged(error, "DatabaseError") ||
        Predicate.isTagged(error, "SecurityError") ||
        Predicate.isTagged(error, "InstanceStateError"),
      (error) =>
        Effect.gen(function* () {
          const unavailable = error instanceof DatabaseError && error.isRetryable;
          yield* Effect.logError("Request dependency failed", {
            boundary: error instanceof DatabaseError ? "database" : "application",
          });
          return yield* new RequestError({
            code: unavailable ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR",
          });
        }),
    ),
  );

export const respondToCause = Effect.fn("http.respondToCause")(function* (
  cause: Cause.Cause<unknown>,
) {
  if (Cause.hasInterruptsOnly(cause)) return yield* Effect.interrupt;

  for (const reason of cause.reasons) {
    const error = Cause.isFailReason(reason)
      ? reason.error
      : Cause.isDieReason(reason)
        ? reason.defect
        : undefined;
    if (error instanceof RequestError) return requestErrorResponse(error.code);
    if (HttpApiError.HttpApiSchemaError.is(error)) {
      if (error.kind === "Body" || error.kind === "ResponseHeaders") {
        yield* Effect.logError("HTTP response encoding failed", { slot: error.kind });
        return requestErrorResponse("INTERNAL_ERROR");
      }
      return requestErrorResponse("INVALID_INPUT");
    }
    if (error instanceof HttpServerError.HttpServerError) {
      if (Predicate.isTagged(error.reason, "RouteNotFound"))
        return requestErrorResponse("NOT_FOUND");
      if (Predicate.isTagged(error.reason, "RequestParseError"))
        return requestErrorResponse("INVALID_INPUT");
    }
  }

  // Causes may contain SQL parameters or request bodies; report the failure without serializing them.
  yield* Effect.logError("Unhandled HTTP failure", {
    failureKind: Cause.hasDies(cause) ? "defect" : "failure",
  });
  return requestErrorResponse("INTERNAL_ERROR");
});
