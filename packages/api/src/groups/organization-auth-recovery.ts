import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { OrganizationId } from "@usepreface/protocol";
import {
  OrganizationAuthRecoveryStatus,
  OrganizationAuthRecoveryIssued,
  RecoverOrganizationAuthRequest,
  PublicOrganizationAuthPolicy,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

const params = { organizationId: OrganizationId };
const errors = [...identityErrors, ...organizationErrors, ...requestErrors];
export class OrganizationAuthRecoveryApi extends HttpApiGroup.make("organizationAuthRecovery")
  .add(
    HttpApiEndpoint.get("get", "/", {
      params,
      success: OrganizationAuthRecoveryStatus,
      error: errors,
    }),
    HttpApiEndpoint.post("rotate", "/rotate", {
      params,
      payload: Schema.Struct({}),
      success: OrganizationAuthRecoveryIssued,
      error: errors,
    }).annotate(
      OpenApi.Description,
      "Issue a replacement owner-bound recovery credential. Its secret is returned only once.",
    ),
    HttpApiEndpoint.delete("revoke", "/", {
      params,
      success: HttpApiSchema.NoContent,
      error: errors,
    }),
    HttpApiEndpoint.post("recover", "/recover", {
      params,
      payload: RecoverOrganizationAuthRequest,
      success: PublicOrganizationAuthPolicy,
      error: errors,
    }).annotate(
      OpenApi.Description,
      "Consume the owner's offline credential and make organization SSO optional. Requires recent local email authentication.",
    ),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations/:organizationId/auth-recovery")
  .annotate(OpenApi.Title, "Organization authentication recovery") {}
