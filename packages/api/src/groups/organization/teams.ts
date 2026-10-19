import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { TeamId, OrganizationMemberId } from "@usepreface/protocol";
import {
  PublicTeam,
  CreateTeamRequest,
  UpdateTeamRequest,
  ListTeamsQuery,
  TeamList,
  TeamAccessInfo,
  ListTeamMembersQuery,
  TeamMemberList,
  ListOrganizationRolesQuery,
  OrganizationRoleList,
} from "@usepreface/protocol/dto";

import { teamErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

const errors = [...teamErrors, ...organizationErrors, ...requestErrors];

const params = { teamId: TeamId };

export class TeamsApi extends HttpApiGroup.make("teams")
  .add(
    HttpApiEndpoint.post("create", "/teams", {
      payload: CreateTeamRequest,
      success: PublicTeam.pipe(HttpApiSchema.status(201)),
      error: errors,
    }),
    HttpApiEndpoint.get("list", "/teams", {
      query: ListTeamsQuery,
      success: TeamList,
      error: errors,
    }),
    HttpApiEndpoint.get("get", "/teams/:teamId", {
      params,
      success: PublicTeam,
      error: errors,
    }),
    HttpApiEndpoint.patch("update", "/teams/:teamId", {
      params,
      payload: UpdateTeamRequest,
      success: PublicTeam,
      error: errors,
    }),
    HttpApiEndpoint.post("archive", "/teams/:teamId/archive", {
      params,
      payload: Schema.Struct({}),
      success: PublicTeam,
      error: errors,
    }),
    HttpApiEndpoint.get("access", "/teams/:teamId/access", {
      params,
      success: TeamAccessInfo,
      error: errors,
    }),
    HttpApiEndpoint.get("roles", "/teams/:teamId/roles", {
      params,
      query: Schema.Struct({
        cursor: ListOrganizationRolesQuery.fields.cursor,
        limit: ListOrganizationRolesQuery.fields.limit,
        includeArchived: ListOrganizationRolesQuery.fields.includeArchived,
      }),
      success: OrganizationRoleList,
      error: errors,
    }),
    HttpApiEndpoint.get("members", "/teams/:teamId/members", {
      params,
      query: ListTeamMembersQuery,
      success: TeamMemberList,
      error: errors,
    }),
    HttpApiEndpoint.put("addMember", "/teams/:teamId/members/:memberId", {
      params: { ...params, memberId: OrganizationMemberId },
      payload: Schema.Struct({}),
      success: Schema.Struct({ isEffectiveMember: Schema.Boolean }),
      error: errors,
    }),
    HttpApiEndpoint.delete("removeMember", "/teams/:teamId/members/:memberId", {
      params: { ...params, memberId: OrganizationMemberId },
      success: Schema.Struct({ isEffectiveMember: Schema.Boolean }),
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization")
  .annotate(OpenApi.Title, "Teams") {}
