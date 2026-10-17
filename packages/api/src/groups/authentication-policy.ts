import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import { OrganizationId } from "@usepreface/protocol";
import {
  PublicOrganizationAuthPolicy,
  OrganizationAuthenticationMethods,
  UpdateOrganizationAuthPolicyRequest,
  OrganizationSsoReadiness,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";
const errors = [...identityErrors, ...organizationErrors, ...requestErrors];
export class AuthenticationPolicyApi extends HttpApiGroup.make("authenticationPolicy")
  .add(
    HttpApiEndpoint.get("methods", "/:organizationId/authentication/methods", {
      params: { organizationId: OrganizationId },
      success: OrganizationAuthenticationMethods,
      error: errors,
    }),
    HttpApiEndpoint.get("readiness", "/:organizationId/auth-policy/readiness", {
      params: { organizationId: OrganizationId },
      success: OrganizationSsoReadiness,
      error: errors,
    }),
    HttpApiEndpoint.patch("update", "/:organizationId/auth-policy", {
      params: { organizationId: OrganizationId },
      payload: UpdateOrganizationAuthPolicyRequest,
      success: PublicOrganizationAuthPolicy,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Organization authentication") {}
