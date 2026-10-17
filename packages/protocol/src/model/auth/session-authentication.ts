import { Schema } from "effect";

import { SessionAuthenticationId, UserEmailId } from "#/identifiers/auth";
import { AccountId } from "#/identifiers/identity";
import { SessionId } from "#/identifiers/session";
import { UserId } from "#/identifiers/user";

export const EmailAuthenticationMethod = Schema.Literals([
  "bootstrap_email_code",
  "email_code",
  "email_link",
]);
export type EmailAuthenticationMethod = typeof EmailAuthenticationMethod.Type;
export const EmailAssurance = Schema.Struct({
  version: Schema.Literal(1),
  emailVerified: Schema.Literal(true),
});
const emailFields = {
  sessionId: SessionId,
  userId: UserId,
  method: EmailAuthenticationMethod,
  userEmailId: UserEmailId,
  authenticatedAt: Schema.DateTimeUtcFromDate,
  expiresAt: Schema.DateTimeUtcFromDate,
  assurance: EmailAssurance,
  accountId: Schema.optionalKey(Schema.Null),
  connectionRevision: Schema.optionalKey(Schema.Null),
};
const googleFields = {
  sessionId: SessionId,
  userId: UserId,
  method: Schema.Literal("google"),
  userEmailId: Schema.Null,
  accountId: AccountId,
  connectionRevision: Schema.Int.check(Schema.isGreaterThan(0)),
  authenticatedAt: Schema.DateTimeUtcFromDate,
  expiresAt: Schema.DateTimeUtcFromDate,
  assurance: Schema.Struct({ version: Schema.Literal(1), provider: Schema.Literal("google") }),
};
export const CreateSessionAuthentication = Schema.Union([
  Schema.Struct(emailFields),
  Schema.Struct(googleFields),
]);
export type CreateSessionAuthentication = typeof CreateSessionAuthentication.Type;
const stored = {
  id: SessionAuthenticationId,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
};
export const SessionAuthentication = Schema.Union([
  Schema.Struct({ ...emailFields, ...stored }),
  Schema.Struct({ ...googleFields, ...stored }),
]);
export type SessionAuthentication = typeof SessionAuthentication.Type;
