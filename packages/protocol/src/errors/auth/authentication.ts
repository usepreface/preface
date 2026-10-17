import { Schema } from "effect";

export class AuthenticationError extends Schema.TaggedError<AuthenticationError>()(
  "AuthenticationError",
  { code: Schema.Literal("UNAUTHENTICATED") },
) {}
