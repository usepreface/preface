import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationId, OrganizationRoleBindingId } from "@usepreface/protocol";
import {
  ListRoleBindingsQuery,
  OrganizationRoleBindingList,
  GrantOrganizationRoleRequest,
  PublicOrganizationRoleBinding,
} from "@usepreface/protocol/dto";

import { teamErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class OrganizationRoleBindingsApi extends HttpApiGroup.make("organizationRoleBindings")
  .add(
    HttpApiEndpoint.get("list", "/:organizationId/role-bindings", {
      params: { organizationId: OrganizationId },
      query: ListRoleBindingsQuery,
      success: OrganizationRoleBindingList,
      error: [...teamErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("grant", "/:organizationId/role-bindings", {
      params: { organizationId: OrganizationId },
      payload: GrantOrganizationRoleRequest,
      success: PublicOrganizationRoleBinding.pipe(HttpApiSchema.status(201)),
      error: [...teamErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("revoke", "/:organizationId/role-bindings/:bindingId", {
      params: { organizationId: OrganizationId, bindingId: OrganizationRoleBindingId },
      success: HttpApiSchema.NoContent,
      error: [...teamErrors, ...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Organization role assignments") {}
