import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

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
    HttpApiEndpoint.get("methods", "/authentication/methods", {
      success: OrganizationAuthenticationMethods,
      error: errors,
    }),
    HttpApiEndpoint.get("readiness", "/auth-policy/readiness", {
      success: OrganizationSsoReadiness,
      error: errors,
    }),
    HttpApiEndpoint.patch("update", "/auth-policy", {
      payload: UpdateOrganizationAuthPolicyRequest,
      success: PublicOrganizationAuthPolicy,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization")
  .annotate(OpenApi.Title, "Organization authentication") {}
