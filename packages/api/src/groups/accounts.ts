import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/http-api";

import { AccountId } from "@usepreface/protocol";
import { AccountList, GoogleStartRequest, GoogleStartResult } from "@usepreface/protocol/dto";

import { identityErrors, organizationErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";
export class AccountsApi extends HttpApiGroup.make("accounts")
  .add(
    HttpApiEndpoint.get("list", "/", {
      success: AccountList,
      error: [...identityErrors, ...requestErrors],
    }),
    HttpApiEndpoint.post("startGoogle", "/google/start", {
      payload: GoogleStartRequest,
      success: GoogleStartResult,
      error: [...identityErrors, ...requestErrors],
    }),
    HttpApiEndpoint.delete("unlink", "/:accountId", {
      params: { accountId: AccountId },
      success: HttpApiSchema.NoContent,
      error: [...identityErrors, ...organizationErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/users/me/accounts")
  .annotate(OpenApi.Title, "Connected accounts") {}
