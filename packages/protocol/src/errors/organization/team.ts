import { Record, Schema } from "effect";
const statuses = {
  INVALID_INPUT: 400,
  TEAM_NOT_FOUND: 404,
  TEAM_ARCHIVED: 409,
  SLUG_UNAVAILABLE: 409,
  MEMBER_NOT_ACTIVE: 409,
  FORBIDDEN: 403,
} as const;
export class TeamError extends Schema.TaggedError<TeamError>()("TeamError", {
  code: Schema.Literals(Record.keys(statuses)),
}) {
  static readonly statuses = statuses;
}
