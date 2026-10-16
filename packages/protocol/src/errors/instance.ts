import { Schema } from "effect";

export class InstanceStateError extends Schema.TaggedError<InstanceStateError>()(
  "InstanceStateError",
  {
    code: Schema.Literals([
      "NOT_INITIALIZED",
      "BOOTSTRAP_COMPLETED",
      "INVALID_BOOTSTRAP_EXPIRY",
      "LAST_OWNER",
    ]),
  },
) {}
