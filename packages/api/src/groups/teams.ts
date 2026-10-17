import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationId, TeamId, OrganizationMemberId } from "@usepreface/protocol";
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
const params = { organizationId: OrganizationId, teamId: TeamId };
export class TeamsApi extends HttpApiGroup.make("teams")
  .add(
    HttpApiEndpoint.post("create", "/:organizationId/teams", {
      params: { organizationId: OrganizationId },
      payload: CreateTeamRequest,
      success: PublicTeam.pipe(HttpApiSchema.status(201)),
      error: errors,
    }),
    HttpApiEndpoint.get("list", "/:organizationId/teams", {
      params: { organizationId: OrganizationId },
      query: ListTeamsQuery,
      success: TeamList,
      error: errors,
    }),
    HttpApiEndpoint.get("get", "/:organizationId/teams/:teamId", {
      params,
      success: PublicTeam,
      error: errors,
    }),
    HttpApiEndpoint.patch("update", "/:organizationId/teams/:teamId", {
      params,
      payload: UpdateTeamRequest,
      success: PublicTeam,
      error: errors,
    }),
    HttpApiEndpoint.post("archive", "/:organizationId/teams/:teamId/archive", {
      params,
      payload: Schema.Struct({}),
      success: PublicTeam,
      error: errors,
    }),
    HttpApiEndpoint.get("access", "/:organizationId/teams/:teamId/access", {
      params,
      success: TeamAccessInfo,
      error: errors,
    }),
    HttpApiEndpoint.get("roles", "/:organizationId/teams/:teamId/roles", {
      params,
      query: Schema.Struct({
        cursor: ListOrganizationRolesQuery.fields.cursor,
        limit: ListOrganizationRolesQuery.fields.limit,
        includeArchived: ListOrganizationRolesQuery.fields.includeArchived,
      }),
      success: OrganizationRoleList,
      error: errors,
    }),
    HttpApiEndpoint.get("members", "/:organizationId/teams/:teamId/members", {
      params,
      query: ListTeamMembersQuery,
      success: TeamMemberList,
      error: errors,
    }),
    HttpApiEndpoint.put("addMember", "/:organizationId/teams/:teamId/members/:memberId", {
      params: { ...params, memberId: OrganizationMemberId },
      payload: Schema.Struct({}),
      success: Schema.Struct({ isEffectiveMember: Schema.Boolean }),
      error: errors,
    }),
    HttpApiEndpoint.delete("removeMember", "/:organizationId/teams/:teamId/members/:memberId", {
      params: { ...params, memberId: OrganizationMemberId },
      success: Schema.Struct({ isEffectiveMember: Schema.Boolean }),
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Teams") {}
