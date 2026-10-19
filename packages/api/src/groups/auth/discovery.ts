import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import {
  AuthenticationDiscovery,
  CurrentOrganizationAuthentication,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";
const errors = [...identityErrors, ...organizationErrors, ...requestErrors];
export class AuthenticationDiscoveryApi extends HttpApiGroup.make("authenticationDiscovery")
  .add(
    HttpApiEndpoint.get("discover", "/auth/discovery", {
      success: AuthenticationDiscovery,
      error: errors,
    }),
  )
  .annotate(OpenApi.Title, "Authentication methods") {}
export class CurrentOrganizationAuthenticationApi extends HttpApiGroup.make(
  "currentOrganizationAuthentication",
)
  .add(
    HttpApiEndpoint.get("get", "/auth/access", {
      success: CurrentOrganizationAuthentication,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .annotate(OpenApi.Title, "Current access") {}
