import { DateTime, Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { SessionId } from "#/identifiers/session";
import { UserId } from "#/identifiers/user";

export const SessionTokenHash = CredentialDigest;

export const CreateSession = Schema.Struct({
  userId: UserId,
  tokenHash: SessionTokenHash,
  expiresAt: Schema.DateTimeUtcFromDate,
});
export type CreateSession = typeof CreateSession.Type;

export const Session = Schema.Struct({
  id: SessionId,
  ...CreateSession.fields,
  createdAt: Schema.DateTimeUtcFromDate,
  lastSeenAt: Schema.DateTimeUtcFromDate,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}).check(
  Schema.makeFilter((session) => {
    const createdAt = DateTime.toEpochMillis(session.createdAt);
    return (
      (DateTime.toEpochMillis(session.expiresAt) > createdAt &&
        DateTime.toEpochMillis(session.lastSeenAt) >= createdAt &&
        (session.revokedAt === null || DateTime.toEpochMillis(session.revokedAt) >= createdAt)) ||
      "Session expiry must follow creation; activity and revocation cannot precede creation"
    );
  }),
);
export type Session = typeof Session.Type;
