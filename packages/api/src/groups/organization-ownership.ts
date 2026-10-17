import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationId, OrganizationMemberId } from "@usepreface/protocol";
import { TransferOrganizationOwnershipRequest } from "@usepreface/protocol/dto";

import { organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationOwnershipApi extends HttpApiGroup.make("organizationOwnership")
  .add(
    HttpApiEndpoint.put("grant", "/:organizationId/owners/:memberId", {
      params: { organizationId: OrganizationId, memberId: OrganizationMemberId },
      payload: Schema.Struct({}),
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("revoke", "/:organizationId/owners/:memberId", {
      params: { organizationId: OrganizationId, memberId: OrganizationMemberId },
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("transfer", "/:organizationId/ownership/transfer", {
      params: { organizationId: OrganizationId },
      payload: TransferOrganizationOwnershipRequest,
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Organization ownership") {}
