import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationRoleId } from "@usepreface/protocol";
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
    HttpApiEndpoint.get("list", "/roles", {
      query: ListOrganizationRolesQuery,
      success: OrganizationRoleList,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("create", "/roles", {
      payload: CreateOrganizationRoleRequest,
      success: PublicOrganizationRole.pipe(HttpApiSchema.status(201)),
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.patch("update", "/roles/:roleId", {
      params: { roleId: OrganizationRoleId },
      payload: UpdateOrganizationRoleRequest,
      success: PublicOrganizationRole,
      error: [...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("archive", "/roles/:roleId", {
      params: { roleId: OrganizationRoleId },
      success: HttpApiSchema.NoContent,
      error: [...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization")
  .annotate(OpenApi.Title, "Organization roles") {}
