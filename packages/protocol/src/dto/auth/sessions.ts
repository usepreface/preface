import { Schema } from "effect";

import { PageSize } from "#/common/pagination";
import { SessionId } from "#/identifiers/session";

export const ListSessionsQuery = Schema.Struct({
  cursor: Schema.optionalKey(SessionId),
  limit: Schema.optionalKey(PageSize),
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
