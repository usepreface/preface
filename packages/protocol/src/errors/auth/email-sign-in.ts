import { Record, Schema } from "effect";
const statuses = {
  INVALID_INPUT: 400,
  INVALID_PROOF: 401,
  INSTANCE_NOT_READY: 409,
  ALREADY_AUTHENTICATED: 409,
} as const;
export class EmailSignInError extends Schema.TaggedError<EmailSignInError>()("EmailSignInError", {
  code: Schema.Literals(Record.keys(statuses)),
}) {
  static readonly statuses = statuses;
}
