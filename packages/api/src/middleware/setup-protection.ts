import { HttpApiMiddleware } from "effect/http-api";

import { requestErrors } from "#/http-errors";

export class SetupProtection extends HttpApiMiddleware.Service<SetupProtection>()(
  "@usepreface/api/SetupProtection",
  { error: requestErrors },
) {}
