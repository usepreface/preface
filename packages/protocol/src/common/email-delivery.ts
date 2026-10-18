import { Schema } from "effect";

export const EmailJobStatus = Schema.Literals([
  "pending",
  "processing",
  "sent",
  "failed",
  "expired",
  "cancelled",
]);
export const EmailProviderName = Schema.Literals([
  "development",
  "smtp",
  "resend",
  "ses",
  "inbound",
]);
export type EmailProviderName = typeof EmailProviderName.Type;

export const EmailJobErrorCode = Schema.Literals([
  "INVALID_PAYLOAD",
  "DECRYPT_FAILED",
  "RENDER_FAILED",
  "AUTHENTICATION_FAILED",
  "RATE_LIMITED",
  "REJECTED",
  "UNAVAILABLE",
  "UNKNOWN_OUTCOME",
  "INVALID_RESPONSE",
  "ATTEMPTS_EXHAUSTED",
]);
export type EmailJobErrorCode = typeof EmailJobErrorCode.Type;
