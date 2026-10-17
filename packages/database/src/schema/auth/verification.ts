import type { VerificationId, UserId, UserEmailId, EmailJobId } from "@usepreface/protocol";
import type { Verification } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { authSchema } from "#/schema/auth/schema";
import { user } from "#/schema/auth/user";
import { userEmail } from "#/schema/auth/user-email";
import { emailJob } from "#/schema/jobs/email";

export const verification = authSchema.table(
  "verification",
  {
    id: uuid("id").$type<VerificationId>().primaryKey(),
    purpose: text("purpose").$type<Verification["purpose"]>().notNull(),
    subjectKey: text("subject_key").notNull(),
    userId: uuid("user_id")
      .$type<UserId>()
      .references(() => user.id, { onDelete: "restrict" }),
    userEmailId: uuid("user_email_id").$type<UserEmailId>(),
    browserBindingHash: text("browser_binding_hash").notNull(),
    codeHash: text("code_hash").notNull(),
    tokenHash: text("token_hash").notNull(),
    emailJobId: uuid("email_job_id")
      .$type<EmailJobId>()
      .references(() => emailJob.id, { onDelete: "restrict" }),
    context: jsonb("context").$type<Verification["context"]>().notNull(),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.userEmailId, table.userId],
      foreignColumns: [userEmail.id, userEmail.userId],
    }).onDelete("restrict"),
    uniqueIndex("verification_pending_subject_uidx")
      .on(table.purpose, table.subjectKey)
      .where(sql`${table.consumedAt} is null and ${table.revokedAt} is null`),
    uniqueIndex("verification_token_uidx").on(table.tokenHash),
    index("verification_expiry_idx").on(table.expiresAt),
    check(
      "verification_purpose_check",
      sql`${table.purpose} in ('email_sign_in', 'invitation_email')`,
    ),
    check("verification_attempts_check", sql`${table.attempts} between 0 and 5`),
    check("verification_expiry_check", sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      "verification_terminal_check",
      sql`not (${table.consumedAt} is not null and ${table.revokedAt} is not null)`,
    ),
    check(
      "verification_terminal_time_check",
      sql`(${table.consumedAt} is null or ${table.consumedAt} >= ${table.createdAt}) and (${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt})`,
    ),
    check(
      "verification_source_check",
      sql`(${table.purpose} = 'email_sign_in' and ((${table.userId} is null and ${table.userEmailId} is null and ${table.emailJobId} is null) or (${table.userId} is not null and ${table.userEmailId} is not null and ${table.emailJobId} is not null))) or (${table.purpose} = 'invitation_email' and ${table.userId} is null and ${table.userEmailId} is null and ${table.emailJobId} is not null)`,
    ),
    check(
      "verification_digest_check",
      sql`${table.subjectKey} ~ '^[0-9a-f]{64}$' and ${table.browserBindingHash} ~ '^[0-9a-f]{64}$' and ${table.codeHash} ~ '^[0-9a-f]{64}$' and ${table.tokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "verification_context_check",
      sql`(${table.purpose} = 'email_sign_in' and ${table.context} = '{"version":1}'::jsonb) or (${table.purpose} = 'invitation_email' and jsonb_typeof(${table.context}) = 'object' and ${table.context}->>'version' = '1' and ${table.context}->>'invitationId' ~ '^[0-9a-f-]{36}$')`,
    ),
  ],
);
