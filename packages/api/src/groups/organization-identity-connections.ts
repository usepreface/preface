import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { IdentityConnectionId, OrganizationId } from "@usepreface/protocol";
import {
  CreateOidcConnectionRequest,
  UpdateOidcConnectionRequest,
  PublicOidcConnection,
  OidcConnectionList,
  IdentityRevisionRequest,
  ExternalIdentityStartRequest,
  ExternalIdentityStartResult,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

const organization = { organizationId: OrganizationId };
const connection = { ...organization, connectionId: IdentityConnectionId };
const errors = [...identityErrors, ...organizationErrors, ...requestErrors];
export class OrganizationIdentityConnectionsApi extends HttpApiGroup.make(
  "organizationIdentityConnections",
)
  .add(
    HttpApiEndpoint.get("list", "/", {
      params: organization,
      success: OidcConnectionList,
      error: errors,
    }),
    HttpApiEndpoint.post("create", "/", {
      params: organization,
      payload: CreateOidcConnectionRequest,
      success: PublicOidcConnection.pipe(HttpApiSchema.status(201)),
      error: errors,
    }),
    HttpApiEndpoint.get("get", "/:connectionId", {
      params: connection,
      success: PublicOidcConnection,
      error: errors,
    }),
    HttpApiEndpoint.patch("update", "/:connectionId", {
      params: connection,
      payload: UpdateOidcConnectionRequest,
      success: PublicOidcConnection,
      error: errors,
    }),
    HttpApiEndpoint.post("test", "/:connectionId/test", {
      params: connection,
      payload: IdentityRevisionRequest,
      success: ExternalIdentityStartResult,
      error: errors,
    }),
    HttpApiEndpoint.post("activate", "/:connectionId/activate", {
      params: connection,
      payload: IdentityRevisionRequest,
      success: PublicOidcConnection,
      error: errors,
    }),
    HttpApiEndpoint.post("disable", "/:connectionId/disable", {
      params: connection,
      payload: IdentityRevisionRequest,
      success: PublicOidcConnection,
      error: errors,
    }),
    HttpApiEndpoint.post("refreshMetadata", "/:connectionId/refresh-metadata", {
      params: connection,
      payload: IdentityRevisionRequest,
      success: PublicOidcConnection,
      error: errors,
    }),
    HttpApiEndpoint.post("link", "/:connectionId/link/start", {
      params: connection,
      payload: ExternalIdentityStartRequest,
      success: ExternalIdentityStartResult,
      error: errors,
    }),
    HttpApiEndpoint.post("reauthenticate", "/:connectionId/reauthenticate/start", {
      params: connection,
      payload: ExternalIdentityStartRequest,
      success: ExternalIdentityStartResult,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organizations/:organizationId/identity-connections")
  .annotate(OpenApi.Title, "Organization OIDC connections") {}
