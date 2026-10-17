import { Record, Schema } from "effect";

const bootstrapErrorStatuses = {
  INVALID_INPUT: 400,
  INVALID_TOKEN: 401,
  INVALID_CODE: 401,
  VERIFICATION_RATE_LIMITED: 429,
  ALREADY_COMPLETED: 409,
  EMAIL_UNAVAILABLE: 409,
} as const;

export class BootstrapError extends Schema.TaggedError<BootstrapError>()("BootstrapError", {
  code: Schema.Literals(Record.keys(bootstrapErrorStatuses)),
}) {
  static readonly statuses = bootstrapErrorStatuses;
}
