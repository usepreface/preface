import { Schema } from "effect";

import { EmailJobId } from "#/identifiers/email";
import { EmailPayload } from "#/model/email/payload";

export const EmailJobStatus = Schema.Literals([
  "pending",
  "processing",
  "sent",
  "failed",
  "expired",
  "cancelled",
]);
export const EmailJobType = Schema.Literals(
  EmailPayload.members.map((member) => member.fields.type.literal),
);
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

export const EnqueueEmailJob = Schema.Struct({
  type: EmailJobType,
  idempotencyKey: Schema.NonEmptyString,
  payloadFingerprint: Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/)),
  encryptedPayload: Schema.NonEmptyString,
  availableAt: Schema.DateTimeUtcFromDate,
  expiresAt: Schema.DateTimeUtcFromDate,
});
export type EnqueueEmailJob = typeof EnqueueEmailJob.Type;

export const EmailJob = Schema.Struct({
  id: EmailJobId,
  ...EnqueueEmailJob.fields,
  encryptedPayload: Schema.NullOr(Schema.String),
  status: EmailJobStatus,
  attempts: Schema.Natural,
  createdAt: Schema.DateTimeUtcFromDate,
  leaseToken: Schema.NullOr(Schema.String),
  leaseExpiresAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  lastErrorCode: Schema.NullOr(EmailJobErrorCode),
  provider: Schema.NullOr(EmailProviderName),
  providerMessageId: Schema.NullOr(Schema.String),
  sentAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type EmailJob = typeof EmailJob.Type;
