import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { IdentityConnectionId } from "@usepreface/protocol";
import {
  ExternalIdentityStartRequest,
  SamlCallbackRequest,
  SamlCompletionQuery,
} from "@usepreface/protocol/dto";

import { identityErrors, invitationErrors, organizationErrors, requestErrors } from "#/http-errors";

const errors = [...identityErrors, ...invitationErrors, ...organizationErrors, ...requestErrors];

export class SamlApi extends HttpApiGroup.make("saml")
  .add(
    HttpApiEndpoint.get(
      "tileStart",
      "/organization/identity-connections/:connectionId/saml/login",
      {
        params: { connectionId: IdentityConnectionId },
        query: ExternalIdentityStartRequest,
        success: HttpApiSchema.NoContent.pipe(HttpApiSchema.status(303)),
        error: errors,
      },
    ).annotate(
      OpenApi.Description,
      "IdP tile entry. Starts a fresh SP-bound login or current-member reauthentication; unsolicited assertions remain rejected.",
    ),
    HttpApiEndpoint.get(
      "metadata",
      "/organization/identity-connections/:connectionId/saml/metadata",
      {
        params: { connectionId: IdentityConnectionId },
        success: Schema.String.pipe(
          HttpApiSchema.asText({ contentType: "application/samlmetadata+xml" }),
        ),
        error: errors,
      },
    ),
    HttpApiEndpoint.post("callback", "/auth/saml/:connectionId/acs", {
      params: { connectionId: IdentityConnectionId },
      payload: SamlCallbackRequest.pipe(HttpApiSchema.asFormUrlEncoded()),
      success: HttpApiSchema.NoContent.pipe(HttpApiSchema.status(303)),
      error: errors,
    }).annotate(
      OpenApi.Description,
      "Provider form POST. Stages a validated response without setting a session, then redirects to cookie-bound completion.",
    ),
    HttpApiEndpoint.get("complete", "/auth/saml/complete", {
      query: SamlCompletionQuery,
      success: HttpApiSchema.NoContent.pipe(HttpApiSchema.status(303)),
      error: errors,
    }),
  )
  .annotate(OpenApi.Title, "Organization SAML") {}
