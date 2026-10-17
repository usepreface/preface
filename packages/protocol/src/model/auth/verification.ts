import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { UserEmailId, VerificationId } from "#/identifiers/auth";
import { EmailJobId } from "#/identifiers/email";
import { UserId } from "#/identifiers/user";

export { CredentialDigest } from "#/common/credential-digest";
export const CreateVerification = Schema.Struct({
  id: VerificationId,
  purpose: Schema.Literal("email_sign_in"),
  subjectKey: CredentialDigest,
  userId: Schema.NullOr(UserId),
  userEmailId: Schema.NullOr(UserEmailId),
  browserBindingHash: CredentialDigest,
  codeHash: CredentialDigest,
  tokenHash: CredentialDigest,
  emailJobId: Schema.NullOr(EmailJobId),
  context: Schema.Struct({ version: Schema.Literal(1) }),
  expiresAt: Schema.DateTimeUtcFromDate,
});
export type CreateVerification = typeof CreateVerification.Type;
export const Verification = Schema.Struct({
  ...CreateVerification.fields,
  attempts: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 5 })),
  createdAt: Schema.DateTimeUtcFromDate,
  consumedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type Verification = typeof Verification.Type;
