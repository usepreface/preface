import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationInvitationId } from "@usepreface/protocol";
import {
  InvitationDelivery,
  CreateInvitationRequest,
  PublicInvitation,
  ListInvitationsQuery,
  InvitationList,
} from "@usepreface/protocol/dto";

import { invitationErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationInvitationsApi extends HttpApiGroup.make("organizationInvitations")
  .add(
    HttpApiEndpoint.get("delivery", "/invitations/:invitationId/delivery", {
      params: { invitationId: OrganizationInvitationId },
      success: InvitationDelivery,
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("create", "/invitations", {
      payload: CreateInvitationRequest,
      success: PublicInvitation.pipe(HttpApiSchema.status(201)),
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.get("list", "/invitations", {
      query: ListInvitationsQuery,
      success: InvitationList,
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("resend", "/invitations/:invitationId/resend", {
      params: { invitationId: OrganizationInvitationId },
      payload: Schema.Struct({}),
      success: PublicInvitation,
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("revoke", "/invitations/:invitationId", {
      params: { invitationId: OrganizationInvitationId },
      success: HttpApiSchema.NoContent,
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization")
  .annotate(OpenApi.Title, "Organization invitations") {}
