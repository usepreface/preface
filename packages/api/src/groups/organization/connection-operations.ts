import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import { IdentityConnectionId, IdentityConnectionKeyId } from "@usepreface/protocol";
import {
  ConnectionHealth,
  PublicConnectionKey,
  ConnectionKeyList,
  IdentityRevisionRequest,
  ExternalIdentityStartResult,
} from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

const params = { connectionId: IdentityConnectionId };

const keyParams = { ...params, keyId: IdentityConnectionKeyId };

const error = [...identityErrors, ...organizationErrors, ...requestErrors];

export class ConnectionOperationsApi extends HttpApiGroup.make("connectionOperations")
  .add(
    HttpApiEndpoint.get("health", "/health", { params, success: ConnectionHealth, error }),
    HttpApiEndpoint.get("keys", "/saml/keys", { params, success: ConnectionKeyList, error }),
    HttpApiEndpoint.post("prepare", "/saml/keys", {
      params,
      payload: IdentityRevisionRequest,
      success: PublicConnectionKey,
      error,
    }),
    HttpApiEndpoint.post("test", "/saml/keys/:keyId/test", {
      params: keyParams,
      payload: IdentityRevisionRequest,
      success: ExternalIdentityStartResult,
      error,
    }),
    HttpApiEndpoint.post("activate", "/saml/keys/:keyId/activate", {
      params: keyParams,
      payload: IdentityRevisionRequest,
      success: PublicConnectionKey,
      error,
    }),
    HttpApiEndpoint.post("retire", "/saml/keys/:keyId/retire", {
      params: keyParams,
      payload: IdentityRevisionRequest,
      success: PublicConnectionKey,
      error,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/organization/identity-connections/:connectionId")
  .annotate(OpenApi.Title, "Connection operations") {}
