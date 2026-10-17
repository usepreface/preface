import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import {
  BootstrapStatus,
  BootstrapTokenInfo,
  BootstrapVerification,
  CompleteBootstrapRequest,
  InspectBootstrapRequest,
  RequestBootstrapVerificationRequest,
  ResendBootstrapVerificationRequest,
  SessionActor,
} from "@usepreface/protocol/dto";

import { bootstrapErrors, requestErrors } from "#/http-errors";
import { SetupProtection } from "#/middleware/setup-protection";

export class InstanceSetupApi extends HttpApiGroup.make("instanceSetup")
  .add(
    HttpApiEndpoint.get("status", "/", { success: BootstrapStatus, error: requestErrors }).annotate(
      OpenApi.Summary,
      "Read instance setup status",
    ),
    HttpApiEndpoint.post("inspect", "/inspect", {
      payload: InspectBootstrapRequest,
      success: BootstrapTokenInfo,
      error: [...bootstrapErrors, ...requestErrors],
    }).annotate(OpenApi.Summary, "Inspect an operator setup proof without consuming it"),
    HttpApiEndpoint.post("requestVerification", "/", {
      payload: RequestBootstrapVerificationRequest,
      success: BootstrapVerification.pipe(HttpApiSchema.status(202)),
      error: [...bootstrapErrors, ...requestErrors],
    })
      .annotate(OpenApi.Summary, "Request the first owner's email verification code")
      .annotate(
        OpenApi.Description,
        "Stores pending setup details and queues the verification email atomically. No user or session is created until code verification succeeds.",
      ),
    HttpApiEndpoint.post("resendVerification", "/resend", {
      payload: ResendBootstrapVerificationRequest,
      success: BootstrapVerification.pipe(HttpApiSchema.status(202)),
      error: [...bootstrapErrors, ...requestErrors],
    }).annotate(OpenApi.Summary, "Replace the pending verification code and queue its email"),
    HttpApiEndpoint.post("complete", "/verify", {
      payload: CompleteBootstrapRequest,
      success: SessionActor.pipe(HttpApiSchema.status(201)),
      error: [...bootstrapErrors, ...requestErrors],
    })
      .annotate(OpenApi.Summary, "Verify the code and create the first owner and session")
      .annotate(
        OpenApi.Description,
        "Requires both the current operator setup proof and the current challenge's email code. Consumes both atomically, records verified email ownership and sets an HttpOnly session cookie.",
      ),
  )
  .middleware(SetupProtection)
  .prefix("/instance/setup")
  .annotateMerge(
    OpenApi.annotations({
      title: "Instance setup",
      description: "One-time passwordless installation onboarding.",
    }),
  ) {}
