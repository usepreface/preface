import { HttpApiMiddleware, HttpApiSchema, HttpApiSecurity } from "effect/http-api";

import { AuthenticationError } from "@usepreface/protocol";

import type { CurrentActor } from "#/context/current-actor";
import { requestErrors } from "#/http-errors";

export const sessionCookieName = "preface_session";
export const sessionSecurity = HttpApiSecurity.apiKey({ in: "cookie", key: sessionCookieName });

export class SessionAuthentication extends HttpApiMiddleware.Service<
  SessionAuthentication,
  {
    provides: CurrentActor;
  }
>()("@usepreface/api/SessionAuthentication", {
  security: { session: sessionSecurity },
  error: [AuthenticationError.pipe(HttpApiSchema.status(401)), ...requestErrors],
}) {}
