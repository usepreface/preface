import { Context } from "effect";

import type { SessionActor } from "@usepreface/protocol";

export class CurrentActor extends Context.Service<CurrentActor, SessionActor>()(
  "@usepreface/api/CurrentActor",
) {}
