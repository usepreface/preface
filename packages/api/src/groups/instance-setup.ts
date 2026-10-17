import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import {
  BootstrapStatus,
  BootstrapTokenInfo,
  CompleteBootstrapRequest,
  InspectBootstrapRequest,
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
    }).annotate(OpenApi.Summary, "Inspect a setup proof without consuming it"),
    HttpApiEndpoint.post("complete", "/", {
      payload: CompleteBootstrapRequest,
      success: SessionActor.pipe(HttpApiSchema.status(201)),
      error: [...bootstrapErrors, ...requestErrors],
    })
      .annotate(OpenApi.Summary, "Create the first owner and authenticated session")
      .annotate(
        OpenApi.Description,
        "Consumes the setup proof atomically. The response sets an HttpOnly session cookie; no session credential is returned in JSON. Email starts unverified.",
      ),
  )
  .middleware(SetupProtection)
  .prefix("/instance/setup")
  .annotateMerge(
    OpenApi.annotations({
      title: "Instance setup",
      description: "One-time installation onboarding.",
    }),
  ) {}
