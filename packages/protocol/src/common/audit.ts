import { Schema } from "effect";

import { AuditEventId } from "#/identifiers/audit";
import { UserId } from "#/identifiers/user";

export const AuditCursor = Schema.Struct({
  occurredAt: Schema.DateTimeUtcFromString,
  id: AuditEventId,
});
export const AuditFilters = {
  cursor: Schema.optionalKey(Schema.String.check(Schema.isMaxLength(256))),
  eventType: Schema.optionalKey(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(120)),
  ),
  actorUserId: Schema.optionalKey(UserId),
  targetId: Schema.optionalKey(Schema.String.check(Schema.isUUID(7))),
  after: Schema.optionalKey(Schema.DateTimeUtcFromString),
  before: Schema.optionalKey(Schema.DateTimeUtcFromString),
};
