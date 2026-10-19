import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import {
  OrganizationAuthRecoveryStatus,
  OrganizationAuthRecoveryIssued,
  RecoverOrganizationAuthRequest,
  PublicOrganizationAuthPolicy,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

const errors = [...identityErrors, ...organizationErrors, ...requestErrors];

export class OrganizationAuthRecoveryApi extends HttpApiGroup.make("organizationAuthRecovery")
  .add(
    HttpApiEndpoint.get("get", "/", {
      success: OrganizationAuthRecoveryStatus,
      error: errors,
    }),
    HttpApiEndpoint.post("rotate", "/rotate", {
      payload: Schema.Struct({}),
      success: OrganizationAuthRecoveryIssued,
      error: errors,
    }).annotate(
      OpenApi.Description,
      "Issue a replacement owner-bound recovery credential. Its secret is returned only once.",
    ),
    HttpApiEndpoint.delete("revoke", "/", {
      success: HttpApiSchema.NoContent,
      error: errors,
    }),
    HttpApiEndpoint.post("recover", "/recover", {
      payload: RecoverOrganizationAuthRequest,
      success: PublicOrganizationAuthPolicy,
      error: errors,
    }).annotate(
      OpenApi.Description,
      "Consume the owner's offline credential and make organization SSO optional. Requires a current owner session.",
    ),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization/auth-recovery")
  .annotate(OpenApi.Title, "Organization authentication recovery") {}
