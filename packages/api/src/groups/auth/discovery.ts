import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import { OrganizationId } from "@usepreface/protocol";
import {
  AuthenticationDiscovery,
  AuthenticationDiscoveryRequest,
  OrganizationSelection,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

const errors = [...identityErrors, ...organizationErrors, ...requestErrors];

export class AuthenticationDiscoveryApi extends HttpApiGroup.make("authenticationDiscovery")
  .add(
    HttpApiEndpoint.post("discover", "/auth/discovery", {
      payload: AuthenticationDiscoveryRequest,
      success: AuthenticationDiscovery,
      error: errors,
    }),
  )
  .annotate(OpenApi.Title, "Authentication discovery") {}

export class OrganizationSelectionApi extends HttpApiGroup.make("organizationSelection")
  .add(
    HttpApiEndpoint.post("select", "/auth/organizations/:organizationId/select", {
      params: { organizationId: OrganizationId },
      payload: Schema.Struct({}),
      success: OrganizationSelection,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .annotate(OpenApi.Title, "Organization selection") {}
