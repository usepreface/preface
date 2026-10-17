import { Schema } from "effect";
export class ProfileError extends Schema.TaggedError<ProfileError>()("ProfileError", {
  code: Schema.Literal("INVALID_INPUT"),
}) {
  static readonly statuses = { INVALID_INPUT: 400 } as const;
}
