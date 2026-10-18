import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { IdentityConnectionId, OrganizationId } from "@usepreface/protocol";
import { SamlCallbackRequest, SamlCompletionQuery } from "@usepreface/protocol/dto";

import { identityErrors, invitationErrors, organizationErrors, requestErrors } from "#/http-errors";

const errors = [...identityErrors, ...invitationErrors, ...organizationErrors, ...requestErrors];
export class SamlApi extends HttpApiGroup.make("saml")
  .add(
    HttpApiEndpoint.get(
      "metadata",
      "/organizations/:organizationId/identity-connections/:connectionId/saml/metadata",
      {
        params: { organizationId: OrganizationId, connectionId: IdentityConnectionId },
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
