import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { SessionId } from "@usepreface/protocol";
import { ListSessionsQuery, SessionList } from "@usepreface/protocol/dto";

import { requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class SessionsApi extends HttpApiGroup.make("sessions")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: ListSessionsQuery,
      success: SessionList,
      error: requestErrors,
    }).annotate(OpenApi.Summary, "List the current user's usable sessions"),
    HttpApiEndpoint.delete("revoke", "/:sessionId", {
      params: { sessionId: SessionId },
      success: HttpApiSchema.NoContent,
      error: requestErrors,
    }).annotate(OpenApi.Summary, "Revoke one of the current user's sessions"),
    HttpApiEndpoint.delete("revokeAll", "/", {
      success: HttpApiSchema.NoContent,
      error: requestErrors,
    }).annotate(OpenApi.Summary, "Revoke all sessions, including the current session"),
  )
  .middleware(SessionAuthentication)
  .prefix("/auth/sessions")
  .annotate(OpenApi.Title, "Session management") {}
