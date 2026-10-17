import { Schema } from "effect";

import { SessionId } from "#/identifiers/session";

export const ListSessionsQuery = Schema.Struct({
  cursor: Schema.optionalKey(SessionId),
  limit: Schema.optionalKey(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 }))),
});
export type ListSessionsQuery = typeof ListSessionsQuery.Type;
export const SessionList = Schema.Struct({
  sessions: Schema.Array(
    Schema.Struct({
      id: SessionId,
      createdAt: Schema.DateTimeUtcFromString,
      lastSeenAt: Schema.DateTimeUtcFromString,
      expiresAt: Schema.DateTimeUtcFromString,
      isCurrent: Schema.Boolean,
    }),
  ),
  nextCursor: Schema.NullOr(SessionId),
});
export type SessionList = typeof SessionList.Type;
