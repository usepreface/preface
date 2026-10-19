import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationMemberId } from "@usepreface/protocol";
import { TransferOrganizationOwnershipRequest } from "@usepreface/protocol/dto";

import { organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationOwnershipApi extends HttpApiGroup.make("organizationOwnership")
  .add(
    HttpApiEndpoint.put("grant", "/owners/:memberId", {
      params: { memberId: OrganizationMemberId },
      payload: Schema.Struct({}),
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("revoke", "/owners/:memberId", {
      params: { memberId: OrganizationMemberId },
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("transfer", "/ownership/transfer", {
      payload: TransferOrganizationOwnershipRequest,
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization")
  .annotate(OpenApi.Title, "Organization ownership") {}
