import { type DateTime, Effect, Predicate, type Redacted } from "effect";
import { HttpServerResponse } from "effect/http";

import type { AuthFlowId } from "@usepreface/protocol";

import { ServerConfig } from "#/config";
import { externalFlowCookie } from "#/http/cookies/browser-proof";
import { setSessionCookie } from "#/http/cookies/session";

interface Completion {
  readonly nextAction: "verify_email" | "continue";
  readonly flowId: AuthFlowId;
  readonly returnPath: string;
  readonly expiresAt?: DateTime.Utc | undefined;
  readonly sessionToken?: Redacted.Redacted<string> | undefined;
  readonly sessionExpiresAt?: DateTime.Utc | undefined;
}

export const completionDestination = Effect.fn("http.authentication.destination")(function* (
  path: string,
) {
  const config = yield* ServerConfig;
  return config.dashboardUrl === undefined || path === "/api/docs"
    ? path
    : new URL(path, config.dashboardUrl).href;
});

export const deliverExternalCompletion = Effect.fn("http.authentication.complete")(function* (
  result: Completion,
  browserToken: Redacted.Redacted<string>,
) {
  if (result.nextAction === "verify_email" && result.expiresAt !== undefined)
    yield* externalFlowCookie.set(browserToken, result.expiresAt);
  else yield* externalFlowCookie.clear;
  if (result.sessionToken !== undefined && result.sessionExpiresAt !== undefined)
    yield* setSessionCookie(result.sessionToken, result.sessionExpiresAt);
  return {
    nextAction: result.nextAction,
    redirectTo: yield* completionDestination(result.returnPath),
  };
});

export const externalCallbackResponse = Effect.fn("http.authentication.redirect")(function* (
  result: Completion,
  browserToken: Redacted.Redacted<string>,
) {
  const delivered = yield* deliverExternalCompletion(result, browserToken);
  return HttpServerResponse.empty({ status: 303, headers: { location: delivered.redirectTo } });
});

export const authenticationFailureRedirect =
  (cookie: { readonly clear: typeof externalFlowCookie.clear }) =>
  <E, R>(effect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>) =>
    effect.pipe(
      Effect.catch((error) =>
        Effect.gen(function* () {
          const config = yield* ServerConfig;
          if (
            config.dashboardUrl === undefined ||
            !(
              Predicate.isTagged(error, "IdentityError") ||
              Predicate.isTagged(error, "InvitationError") ||
              Predicate.isTagged(error, "OrganizationError")
            ) ||
            !Predicate.hasProperty(error, "code") ||
            typeof error.code !== "string"
          )
            return yield* Effect.fail(error);
          yield* cookie.clear;
          yield* externalFlowCookie.clear;
          const destination = new URL("/auth/error", config.dashboardUrl);
          destination.searchParams.set("code", error.code);
          return HttpServerResponse.empty({ status: 303, headers: { location: destination.href } });
        }),
      ),
    );
