import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationRoleBindingId } from "@usepreface/protocol";
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
    HttpApiEndpoint.get("list", "/role-bindings", {
      query: ListRoleBindingsQuery,
      success: OrganizationRoleBindingList,
      error: [...teamErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("grant", "/role-bindings", {
      payload: GrantOrganizationRoleRequest,
      success: PublicOrganizationRoleBinding.pipe(HttpApiSchema.status(201)),
      error: [...teamErrors, ...organizationErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("revoke", "/role-bindings/:bindingId", {
      params: { bindingId: OrganizationRoleBindingId },
      success: HttpApiSchema.NoContent,
      error: [...teamErrors, ...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization")
  .annotate(OpenApi.Title, "Organization role assignments") {}
