import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationId, OrganizationRoleId } from "@usepreface/protocol";
import {
  CreateOrganizationRoleRequest,
  UpdateOrganizationRoleRequest,
  PublicOrganizationRole,
  ListOrganizationRolesQuery,
  OrganizationRoleList,
} from "@usepreface/protocol/dto";

import { organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationRolesApi extends HttpApiGroup.make("organizationRoles")
  .add(
    HttpApiEndpoint.get("list", "/:organizationId/roles", {
      params: { organizationId: OrganizationId },
      query: ListOrganizationRolesQuery,
      success: OrganizationRoleList,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("create", "/:organizationId/roles", {
      params: { organizationId: OrganizationId },
      payload: CreateOrganizationRoleRequest,
      success: PublicOrganizationRole.pipe(HttpApiSchema.status(201)),
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.patch("update", "/:organizationId/roles/:roleId", {
      params: { organizationId: OrganizationId, roleId: OrganizationRoleId },
      payload: UpdateOrganizationRoleRequest,
      success: PublicOrganizationRole,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("archive", "/:organizationId/roles/:roleId", {
      params: { organizationId: OrganizationId, roleId: OrganizationRoleId },
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Organization roles") {}
