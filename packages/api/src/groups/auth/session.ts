import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { SessionActor } from "@usepreface/protocol/dto";

import { requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class SessionApi extends HttpApiGroup.make("session")
  .add(
    HttpApiEndpoint.get("current", "/", { success: SessionActor, error: requestErrors })
      .middleware(SessionAuthentication)
      .annotate(OpenApi.Summary, "Read the current authenticated session"),
    HttpApiEndpoint.delete("revoke", "/", {
      success: HttpApiSchema.NoContent,
      error: requestErrors,
    })
      .annotate(OpenApi.Summary, "Revoke the current session and clear its cookie")
      .annotate(
        OpenApi.Description,
        "An absent or invalid session succeeds without creating an audit event. A valid session and its revocation audit commit together.",
      ),
  )
  .prefix("/auth/session")
  .annotate(OpenApi.Title, "Session") {}
