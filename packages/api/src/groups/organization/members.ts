import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationId, OrganizationMemberId } from "@usepreface/protocol";
import { ListOrganizationMembersQuery, OrganizationMemberList } from "@usepreface/protocol/dto";

import { organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationMembersApi extends HttpApiGroup.make("organizationMembers")
  .add(
    HttpApiEndpoint.get("list", "/:organizationId/members", {
      params: { organizationId: OrganizationId },
      query: ListOrganizationMembersQuery,
      success: OrganizationMemberList,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("suspend", "/:organizationId/members/:memberId/suspend", {
      params: { organizationId: OrganizationId, memberId: OrganizationMemberId },
      payload: Schema.Struct({}),
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("reinstate", "/:organizationId/members/:memberId/reinstate", {
      params: { organizationId: OrganizationId, memberId: OrganizationMemberId },
      payload: Schema.Struct({}),
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("remove", "/:organizationId/members/:memberId", {
      params: { organizationId: OrganizationId, memberId: OrganizationMemberId },
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("leave", "/:organizationId/leave", {
      params: { organizationId: OrganizationId },
      payload: Schema.Struct({}),
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Organization membership") {}
