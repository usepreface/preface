import { Schema } from "effect";

import { EmailJobStatus, EmailProviderName, EmailJobErrorCode } from "#/common/email-delivery";
export const InvitationDelivery = Schema.Struct({
  status: EmailJobStatus,
  attempts: Schema.Natural,
  provider: Schema.NullOr(EmailProviderName),
  lastErrorCode: Schema.NullOr(EmailJobErrorCode),
  availableAt: Schema.DateTimeUtcFromString,
  sentAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  expiresAt: Schema.DateTimeUtcFromString,
});
