import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import {
  AuthenticationMethods,
  GoogleStartRequest,
  GoogleStartResult,
  GoogleCallbackQuery,
} from "@usepreface/protocol/dto";

import { identityErrors, requestErrors } from "#/http-errors";
export class GoogleApi extends HttpApiGroup.make("google")
  .add(
    HttpApiEndpoint.get("methods", "/methods", {
      success: AuthenticationMethods,
      error: [...identityErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("start", "/google/start", {
      payload: GoogleStartRequest,
      success: GoogleStartResult,
      error: [...identityErrors, ...requestErrors],
    }),
    HttpApiEndpoint.get("callback", "/google/callback", {
      query: GoogleCallbackQuery,
      success: HttpApiSchema.NoContent.pipe(HttpApiSchema.status(303)),
      error: [...identityErrors, ...requestErrors],
    }),
  )
  .prefix("/auth")
  .annotate(OpenApi.Title, "Google sign-in") {}
