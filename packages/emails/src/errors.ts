import { Schema } from "effect";

import { EmailJobErrorCode } from "@usepreface/protocol/model";

export class EmailError extends Schema.TaggedError<EmailError>()("EmailError", {
  code: Schema.Literals([
    "INVALID_PAYLOAD",
    "INVALID_EXPIRY",
    "IDEMPOTENCY_CONFLICT",
    "ENCRYPT_FAILED",
    "DECRYPT_FAILED",
    "RENDER_FAILED",
  ]),
}) {
  override readonly message = "Email operation failed";
}

export class EmailProviderError extends Schema.TaggedError<EmailProviderError>()(
  "EmailProviderError",
  {
    code: EmailJobErrorCode,
    retryable: Schema.Boolean,
  },
) {
  override readonly message = "Email provider operation failed";
}
