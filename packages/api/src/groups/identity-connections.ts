import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import {
  PublicGoogleConnection,
  SaveGoogleConnectionRequest,
  IdentityRevisionRequest,
  GoogleStartResult,
} from "@usepreface/protocol/dto";

import { identityErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";
const errors = [...identityErrors, ...requestErrors];
export class IdentityConnectionsApi extends HttpApiGroup.make("identityConnections")
  .add(
    HttpApiEndpoint.get("getGoogle", "/google", { success: PublicGoogleConnection, error: errors }),
    HttpApiEndpoint.put("saveGoogle", "/google", {
      payload: SaveGoogleConnectionRequest,
      success: PublicGoogleConnection,
      error: errors,
    }),
    HttpApiEndpoint.post("testGoogle", "/google/test", {
      payload: IdentityRevisionRequest,
      success: GoogleStartResult,
      error: errors,
    }),
    HttpApiEndpoint.post("activateGoogle", "/google/activate", {
      payload: IdentityRevisionRequest,
      success: PublicGoogleConnection,
      error: errors,
    }),
    HttpApiEndpoint.post("disableGoogle", "/google/disable", {
      payload: IdentityRevisionRequest,
      success: PublicGoogleConnection,
      error: errors,
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/instance/authentication")
  .annotate(OpenApi.Title, "Instance authentication") {}
