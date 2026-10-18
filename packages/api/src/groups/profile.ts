import { HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/http-api";

import { PublicUser, UpdateProfileRequest } from "@usepreface/protocol/dto";

import { profileErrors, requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class ProfileApi extends HttpApiGroup.make("profile")
  .add(
    HttpApiEndpoint.get("get", "/me", {
      success: PublicUser,
      error: [...profileErrors, ...requestErrors],
    }),
    HttpApiEndpoint.patch("update", "/me", {
      payload: UpdateProfileRequest,
      success: PublicUser,
      error: [...profileErrors, ...requestErrors],
    }),
  )
  .middleware(SessionAuthentication)
  .prefix("/users")
  .annotate(OpenApi.Title, "Profile") {}
