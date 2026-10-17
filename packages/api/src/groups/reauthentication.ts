import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import {
  EmailSignInChallenge,
  ResendEmailSignInRequest,
  VerifyEmailSignInRequest,
  GoogleStartRequest,
  GoogleStartResult,
} from "@usepreface/protocol/dto";

import { identityErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";
const errors = [...identityErrors, ...requestErrors];
export class ReauthenticationApi extends HttpApiGroup.make("reauthentication")
  .add(
    HttpApiEndpoint.post("requestEmail", "/email/request", {
      payload: Schema.Struct({}),
      success: EmailSignInChallenge.pipe(HttpApiSchema.status(202)),
      error: errors,
    }),
    HttpApiEndpoint.post("resendEmail", "/email/resend", {
      payload: ResendEmailSignInRequest,
      success: EmailSignInChallenge.pipe(HttpApiSchema.status(202)),
      error: errors,
    }),
    HttpApiEndpoint.post("verifyEmail", "/email/verify", {
      payload: VerifyEmailSignInRequest,
      success: HttpApiSchema.NoContent,
      error: errors,
    }),
    HttpApiEndpoint.post("startGoogle", "/google/start", {
      payload: GoogleStartRequest,
      success: GoogleStartResult,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/auth/reauthentication")
  .annotate(OpenApi.Title, "Reauthentication") {}
