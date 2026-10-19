import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationMemberId } from "@usepreface/protocol";
import { ListOrganizationMembersQuery, OrganizationMemberList } from "@usepreface/protocol/dto";

import { organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationMembersApi extends HttpApiGroup.make("organizationMembers")
  .add(
    HttpApiEndpoint.get("list", "/members", {
      query: ListOrganizationMembersQuery,
      success: OrganizationMemberList,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("suspend", "/members/:memberId/suspend", {
      params: { memberId: OrganizationMemberId },
      payload: Schema.Struct({}),
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("reinstate", "/members/:memberId/reinstate", {
      params: { memberId: OrganizationMemberId },
      payload: Schema.Struct({}),
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("remove", "/members/:memberId", {
      params: { memberId: OrganizationMemberId },
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("leave", "/leave", {
      payload: Schema.Struct({}),
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization")
  .annotate(OpenApi.Title, "Organization membership") {}
