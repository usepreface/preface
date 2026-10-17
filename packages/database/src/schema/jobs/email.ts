import { Schema } from "effect";

import { EmailJobId } from "@usepreface/protocol";
import type { EmailJob } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";

export const jobsSchema = pgSchema("jobs");

export const emailJob = jobsSchema.table(
  "email",
  {
    id: uuid("id")
      .$type<EmailJobId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(EmailJobId)(generateUuid7())),
    type: text("type").$type<EmailJob["type"]>().notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    payloadFingerprint: text("payload_fingerprint").notNull(),
    encryptedPayload: text("encrypted_payload"),
    status: text("status").$type<EmailJob["status"]>().notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    leaseToken: text("lease_token"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    lastErrorCode: text("last_error_code").$type<EmailJob["lastErrorCode"]>(),
    provider: text("provider").$type<EmailJob["provider"]>(),
    providerMessageId: text("provider_message_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("email_idempotency_key_unique").on(table.idempotencyKey),
    index("email_pending_idx")
      .on(table.availableAt)
      .where(sql`${table.status} = 'pending'`),
    index("email_lease_idx")
      .on(table.leaseExpiresAt)
      .where(sql`${table.status} = 'processing'`),
    check(
      "email_status_check",
      sql`${table.status} in ('pending', 'processing', 'sent', 'failed', 'expired', 'cancelled')`,
    ),
    check("email_attempts_check", sql`${table.attempts} >= 0`),
    check("email_expiry_check", sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      "email_lease_check",
      sql`(${table.status} = 'processing' and ${table.leaseToken} is not null and ${table.leaseExpiresAt} is not null)
    or (${table.status} <> 'processing' and ${table.leaseToken} is null and ${table.leaseExpiresAt} is null)`,
    ),
    check(
      "email_payload_check",
      sql`(${table.status} in ('pending', 'processing') and ${table.encryptedPayload} is not null)
    or (${table.status} in ('sent', 'failed', 'expired', 'cancelled') and ${table.encryptedPayload} is null)`,
    ),
  ],
);
