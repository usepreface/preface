import { Schema } from "effect";

import { EmailJobStatus, EmailProviderName, EmailJobErrorCode } from "#/common/email-delivery";
import { EmailJobId } from "#/identifiers/email";
import { EmailPayload } from "#/model/email/payload";
export { EmailJobStatus, EmailProviderName, EmailJobErrorCode } from "#/common/email-delivery";
export const EmailJobType = Schema.Literals(
  EmailPayload.members.map((member) => member.fields.type.literal),
);

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
