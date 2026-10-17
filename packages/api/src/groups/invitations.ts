import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { AuthenticationError } from "@usepreface/protocol";
import {
  InvitationTokenRequest,
  InvitationPreview,
  EmailSignInChallenge,
  AcceptInvitationRequest,
  InvitationAcceptance,
} from "@usepreface/protocol/dto";

import { invitationErrors, requestErrors } from "#/http-errors";

export class InvitationsApi extends HttpApiGroup.make("invitations")
  .add(
    HttpApiEndpoint.post("inspect", "/inspect", {
      payload: InvitationTokenRequest,
      success: InvitationPreview,
      error: [...invitationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("requestVerification", "/verification/request", {
      payload: InvitationTokenRequest,
      success: EmailSignInChallenge.pipe(HttpApiSchema.status(202)),
      error: [...invitationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("accept", "/accept", {
      payload: AcceptInvitationRequest,
      success: InvitationAcceptance.pipe(HttpApiSchema.status(201)),
      error: [
        ...invitationErrors,
        AuthenticationError.pipe(HttpApiSchema.status(401)),
        ...requestErrors,
      ],
    }),
  )
  .prefix("/invitations")
  .annotate(OpenApi.Title, "Invitation acceptance") {}
