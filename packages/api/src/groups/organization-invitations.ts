import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationId, OrganizationInvitationId } from "@usepreface/protocol";
import {
  CreateInvitationRequest,
  PublicInvitation,
  ListInvitationsQuery,
  InvitationList,
} from "@usepreface/protocol/dto";

import { invitationErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationInvitationsApi extends HttpApiGroup.make("organizationInvitations")
  .add(
    HttpApiEndpoint.post("create", "/:organizationId/invitations", {
      params: { organizationId: OrganizationId },
      payload: CreateInvitationRequest,
      success: PublicInvitation.pipe(HttpApiSchema.status(201)),
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.get("list", "/:organizationId/invitations", {
      params: { organizationId: OrganizationId },
      query: ListInvitationsQuery,
      success: InvitationList,
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("resend", "/:organizationId/invitations/:invitationId/resend", {
      params: { organizationId: OrganizationId, invitationId: OrganizationInvitationId },
      payload: Schema.Struct({}),
      success: PublicInvitation,
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("revoke", "/:organizationId/invitations/:invitationId", {
      params: { organizationId: OrganizationId, invitationId: OrganizationInvitationId },
      success: HttpApiSchema.NoContent,
      error: [...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Organization invitations") {}
