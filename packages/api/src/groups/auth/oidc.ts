import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { IdentityConnectionId } from "@usepreface/protocol";
import {
  ExternalIdentityStartRequest,
  ExternalIdentityStartResult,
  ExternalIdentityCallbackQuery,
} from "@usepreface/protocol/dto";

import { identityErrors, invitationErrors, organizationErrors, requestErrors } from "#/http-errors";

export class OidcApi extends HttpApiGroup.make("oidc")
  .add(
    HttpApiEndpoint.post(
      "start",
      "/organization/identity-connections/:connectionId/sign-in/start",
      {
        params: { connectionId: IdentityConnectionId },
        payload: ExternalIdentityStartRequest,
        success: ExternalIdentityStartResult,
        error: [...identityErrors, ...invitationErrors, ...organizationErrors, ...requestErrors],
      },
    ),
    HttpApiEndpoint.get("callback", "/auth/oidc/callback", {
      query: ExternalIdentityCallbackQuery,
      success: HttpApiSchema.NoContent.pipe(HttpApiSchema.status(303)),
      error: [...identityErrors, ...invitationErrors, ...organizationErrors, ...requestErrors],
    }),
  )
  .annotate(OpenApi.Title, "Organization OIDC sign-in") {}
