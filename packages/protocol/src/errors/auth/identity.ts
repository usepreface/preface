import { Record, Schema } from "effect";
const statuses = {
  INVALID_INPUT: 400,
  FORBIDDEN: 403,
  CONNECTION_UNAVAILABLE: 409,
  REVISION_CONFLICT: 409,
  CONNECTION_NOT_TESTED: 409,
  INVALID_FLOW: 401,
  IDENTITY_NOT_LINKED: 401,
  ACCOUNT_ALREADY_LINKED: 409,
  ACCOUNT_MISMATCH: 409,
  ACCOUNT_NOT_FOUND: 404,
  REAUTHENTICATION_REQUIRED: 403,
  INVALID_PROOF: 401,
  PROVIDER_UNAVAILABLE: 503,
  ALREADY_AUTHENTICATED: 409,
  EMAIL_UNAVAILABLE: 409,
} as const;
export class IdentityError extends Schema.TaggedError<IdentityError>()("IdentityError", {
  code: Schema.Literals(Record.keys(statuses)),
}) {
  static readonly statuses = statuses;
}
