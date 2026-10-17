import { Schema } from "effect";

import { SessionAuthenticationId, UserEmailId } from "#/identifiers/auth";
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
export const CreateSessionAuthentication = Schema.Struct({
  sessionId: SessionId,
  userId: UserId,
  method: EmailAuthenticationMethod,
  userEmailId: UserEmailId,
  authenticatedAt: Schema.DateTimeUtcFromDate,
  expiresAt: Schema.DateTimeUtcFromDate,
  assurance: EmailAssurance,
});
export type CreateSessionAuthentication = typeof CreateSessionAuthentication.Type;
export const SessionAuthentication = Schema.Struct({
  id: SessionAuthenticationId,
  ...CreateSessionAuthentication.fields,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type SessionAuthentication = typeof SessionAuthentication.Type;
