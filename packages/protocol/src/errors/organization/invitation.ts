import { Record, Schema } from "effect";

const statuses = {
  INVALID_INPUT: 400,
  INVALID_INVITATION: 401,
  INVALID_PROOF: 401,
  ACCOUNT_MISMATCH: 409,
  RECIPIENT_UNAVAILABLE: 409,
  INVITATION_NOT_FOUND: 404,
  INVITER_NOT_AUTHORIZED: 409,
  ASSIGNMENT_UNAVAILABLE: 409,
} as const;
export class InvitationError extends Schema.TaggedError<InvitationError>()("InvitationError", {
  code: Schema.Literals(Record.keys(statuses)),
}) {
  static readonly statuses = statuses;
}
