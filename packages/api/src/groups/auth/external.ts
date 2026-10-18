import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { AuthFlowId } from "@usepreface/protocol";
import {
  EmailSignInChallenge,
  ExternalCompletion,
  ExternalFlowStatus,
  InvitationAuthenticationRequest,
  ExternalIdentityStartResult,
  VerifyExternalEmailRequest,
} from "@usepreface/protocol/dto";

import { identityErrors, invitationErrors, organizationErrors, requestErrors } from "#/http-errors";

const errors = [...identityErrors, ...invitationErrors, ...organizationErrors, ...requestErrors];

const params = { flowId: AuthFlowId };

export class ExternalAuthenticationApi extends HttpApiGroup.make("externalAuthentication")
  .add(
    HttpApiEndpoint.post("startInvitation", "/invitations/authentication/start", {
      payload: InvitationAuthenticationRequest,
      success: ExternalIdentityStartResult,
      error: errors,
    }),
    HttpApiEndpoint.get("status", "/auth/external/flows/:flowId", {
      params,
      success: ExternalFlowStatus,
      error: errors,
    }),
    HttpApiEndpoint.post("requestEmail", "/auth/external/flows/:flowId/email/request", {
      params,
      payload: Schema.Struct({}),
      success: EmailSignInChallenge.pipe(HttpApiSchema.status(202)),
      error: errors,
    }),
    HttpApiEndpoint.post("verifyEmail", "/auth/external/flows/:flowId/email/verify", {
      params,
      payload: VerifyExternalEmailRequest,
      success: ExternalCompletion,
      error: errors,
    }),
    HttpApiEndpoint.post("resume", "/auth/external/flows/:flowId/complete", {
      params,
      payload: Schema.Struct({}),
      success: ExternalCompletion,
      error: errors,
    }),
  )
  .annotate(OpenApi.Title, "Invitation enrollment and external authentication") {}
