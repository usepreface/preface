import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import {
  UpdateOrganizationRequest,
  OrganizationDetail,
  PublicOrganization,
  OrganizationAccessInfo,
  PublicOrganizationAuthPolicy,
} from "@usepreface/protocol/dto";

import { organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";
const errors = [...organizationErrors, ...requestErrors];
export class OrganizationsApi extends HttpApiGroup.make("organizations")
  .add(
    HttpApiEndpoint.get("get", "/organization", { success: OrganizationDetail, error: errors }),
    HttpApiEndpoint.get("access", "/organization/access", {
      success: OrganizationAccessInfo,
      error: errors,
    }),
    HttpApiEndpoint.patch("update", "/organization", {
      payload: UpdateOrganizationRequest,
      success: PublicOrganization,
      error: errors,
    }),
    HttpApiEndpoint.get("authPolicy", "/organization/auth-policy", {
      success: PublicOrganizationAuthPolicy,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .annotate(OpenApi.Title, "Organization") {}
