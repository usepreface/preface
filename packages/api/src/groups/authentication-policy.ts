import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import { OrganizationId } from "@usepreface/protocol";
import {
  PublicOrganizationAuthPolicy,
  OrganizationAuthenticationMethods,
  UpdateGooglePolicyRequest,
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
    HttpApiEndpoint.patch("update", "/:organizationId/auth-policy", {
      params: { organizationId: OrganizationId },
      payload: UpdateGooglePolicyRequest,
      success: PublicOrganizationAuthPolicy,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations")
  .annotate(OpenApi.Title, "Organization authentication") {}
