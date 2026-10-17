import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import {
  EmailSignInChallenge,
  RequestEmailSignInRequest,
  ResendEmailSignInRequest,
  VerifyEmailSignInRequest,
  SessionActor,
} from "@usepreface/protocol/dto";

import { emailSignInErrors, requestErrors } from "#/http-errors";

export class EmailSignInApi extends HttpApiGroup.make("emailSignIn")
  .add(
    HttpApiEndpoint.post("request", "/request", {
      payload: RequestEmailSignInRequest,
      success: EmailSignInChallenge.pipe(HttpApiSchema.status(202)),
      error: [...emailSignInErrors, ...requestErrors],
    }).annotate(OpenApi.Summary, "Request an email sign-in code and magic link"),
    HttpApiEndpoint.post("resend", "/resend", {
      payload: ResendEmailSignInRequest,
      success: EmailSignInChallenge.pipe(HttpApiSchema.status(202)),
      error: [...emailSignInErrors, ...requestErrors],
    }).annotate(OpenApi.Summary, "Replace a pending browser-bound sign-in proof"),
    HttpApiEndpoint.post("verify", "/verify", {
      payload: VerifyEmailSignInRequest,
      success: SessionActor.pipe(HttpApiSchema.status(201)),
      error: [...emailSignInErrors, ...requestErrors],
    }).annotate(OpenApi.Summary, "Verify email ownership and create an authenticated session"),
  )
  .prefix("/auth/email")
  .annotate(OpenApi.Title, "Email sign-in") {}
