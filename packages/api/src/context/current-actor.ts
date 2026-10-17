import { Context } from "effect";

import type { SessionActor } from "@usepreface/protocol/dto";

export class CurrentActor extends Context.Service<CurrentActor, SessionActor>()(
  "@usepreface/api/CurrentActor",
) {}
