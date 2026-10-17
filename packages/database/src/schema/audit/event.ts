import { Schema } from "effect";

import { AuditEventId, type OrganizationId, type UserId } from "@usepreface/protocol";
import type { AuditActorKind, AuditEvent } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import { check, index, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { auditSchema } from "#/schema/audit/schema";
import { user } from "#/schema/auth/user";
import { organization } from "#/schema/organization/organization";

export const auditEvent = auditSchema.table(
  "event",
  {
    id: uuid("id")
      .$type<AuditEventId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(AuditEventId)(generateUuid7())),
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .references(() => organization.id, { onDelete: "restrict" }),
    eventType: text("event_type").$type<AuditEvent["eventType"]>().notNull(),
    actorKind: text("actor_kind").$type<AuditActorKind>().notNull(),
    actorUserId: uuid("actor_user_id")
      .$type<UserId>()
      .references(() => user.id, { onDelete: "restrict" }),
    targetType: text("target_type").$type<AuditEvent["targetType"]>().notNull(),
    // Targets span tables; the event-specific protocol contract owns this relationship.
    targetId: uuid("target_id").$type<AuditEvent["targetId"]>().notNull(),
    metadata: jsonb("metadata").$type<AuditEvent["metadata"]>().notNull().default({}),
    occurredAt: timestamp("occurred_at", { mode: "date", withTimezone: true }).notNull(),
  },
  (table) => [
    index("event_organization_chronology_idx").on(table.organizationId, table.occurredAt, table.id),
    index("event_chronology_idx").on(table.occurredAt, table.id),
    index("event_actor_chronology_idx").on(table.actorUserId, table.occurredAt),
    index("event_target_chronology_idx").on(table.targetType, table.targetId, table.occurredAt),
    check("event_actor_kind_check", sql`${table.actorKind} in ('user', 'system')`),
    check(
      "event_actor_attribution_check",
      sql`(${table.actorKind} = 'user' and ${table.actorUserId} is not null)
        or (${table.actorKind} = 'system' and ${table.actorUserId} is null)`,
    ),
    check("event_type_check", sql`btrim(${table.eventType}) <> ''`),
    check("event_target_type_check", sql`btrim(${table.targetType}) <> ''`),
    check("event_metadata_object_check", sql`jsonb_typeof(${table.metadata}) = 'object'`),
  ],
);
