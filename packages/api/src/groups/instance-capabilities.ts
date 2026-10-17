import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";

import { InstanceCapabilities } from "@usepreface/protocol/dto";

import { requestErrors } from "#/http-errors";
import { SessionAuthentication } from "#/middleware/session-authentication";

export class InstanceCapabilitiesApi extends HttpApiGroup.make("instanceCapabilities")
  .add(
    HttpApiEndpoint.get("get", "/instance/capabilities", {
      success: InstanceCapabilities,
      error: requestErrors,
    }),
  )
  .middleware(SessionAuthentication) {}
