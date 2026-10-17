import { Schema } from "effect";

// Provider failures deliberately omit inputs and native error details.
export class SecurityError extends Schema.TaggedError<SecurityError>()("SecurityError", {
  operation: Schema.Literals(["token_generate", "token_digest"]),
}) {}
