import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { UserEmailId, VerificationId } from "#/identifiers/auth";
import { EmailJobId } from "#/identifiers/email";
import { OrganizationInvitationId } from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";

export { CredentialDigest } from "#/common/credential-digest";
const proofFields = {
  id: VerificationId,
  subjectKey: CredentialDigest,
  browserBindingHash: CredentialDigest,
  codeHash: CredentialDigest,
  tokenHash: CredentialDigest,
  expiresAt: Schema.DateTimeUtcFromDate,
};
const signInFields = {
  ...proofFields,
  purpose: Schema.Literal("email_sign_in"),
  userId: Schema.NullOr(UserId),
  userEmailId: Schema.NullOr(UserEmailId),
  emailJobId: Schema.NullOr(EmailJobId),
  context: Schema.Struct({ version: Schema.Literal(1) }),
};
const invitationFields = {
  ...proofFields,
  purpose: Schema.Literal("invitation_email"),
  userId: Schema.Null,
  userEmailId: Schema.Null,
  emailJobId: EmailJobId,
  context: Schema.Struct({ version: Schema.Literal(1), invitationId: OrganizationInvitationId }),
};
export const CreateVerification = Schema.Union([
  Schema.Struct(signInFields),
  Schema.Struct(invitationFields),
]);
export type CreateVerification = typeof CreateVerification.Type;
const lifecycle = {
  attempts: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 5 })),
  createdAt: Schema.DateTimeUtcFromDate,
  consumedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
};
export const Verification = Schema.Union([
  Schema.Struct({ ...signInFields, ...lifecycle }),
  Schema.Struct({ ...invitationFields, ...lifecycle }),
]);
export type Verification = typeof Verification.Type;
