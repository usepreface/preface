import { Schema } from "effect";

import { AuditFilters } from "#/common/audit";
import { AuditEventId } from "#/identifiers/audit";
import { OrganizationId } from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";

const metadataValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.Boolean,
  Schema.Null,
  Schema.Array(Schema.String),
]);
export const PublicAuditEvent = Schema.Struct({
  id: AuditEventId,
  organizationId: Schema.NullOr(OrganizationId),
  eventType: Schema.String,
  actorKind: Schema.Literals(["user", "system"]),
  actorUserId: Schema.NullOr(UserId),
  targetType: Schema.String,
  targetId: Schema.String,
  occurredAt: Schema.DateTimeUtcFromString,
  metadata: Schema.Record(Schema.String, metadataValue),
});
export const ListAuditEventsQuery = Schema.Struct({
  ...AuditFilters,
  limit: Schema.optionalKey(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 }))),
});
export type ListAuditEventsQuery = typeof ListAuditEventsQuery.Type;
export const AuditEventPage = Schema.Struct({
  events: Schema.Array(PublicAuditEvent),
  nextCursor: Schema.NullOr(Schema.String),
});
export const AuditExportQuery = Schema.Struct(AuditFilters);
export type AuditExportQuery = typeof AuditExportQuery.Type;
export const AuditExport = Schema.Struct({
  contentType: Schema.Literal("text/csv"),
  filename: Schema.String,
  content: Schema.String,
  nextCursor: Schema.NullOr(Schema.String),
});
