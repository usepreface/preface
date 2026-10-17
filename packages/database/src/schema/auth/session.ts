import { Schema } from "effect";

import { SessionId, type UserId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { authSchema } from "#/schema/auth/schema";
import { user } from "#/schema/auth/user";

export const session = authSchema.table(
  "session",
  {
    id: uuid("id")
      .$type<SessionId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(SessionId)(generateUuid7())),
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
  },
  (table) => [
    uniqueIndex("session_token_hash_uidx").on(table.tokenHash),
    index("session_user_created_idx").on(table.userId, table.createdAt),
    index("session_expiry_idx").on(table.expiresAt),
    check("session_token_hash_check", sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`),
    check("session_expiry_check", sql`${table.expiresAt} > ${table.createdAt}`),
    check("session_activity_time_check", sql`${table.lastSeenAt} >= ${table.createdAt}`),
    check("session_revocation_time_check", sql`${table.revokedAt} >= ${table.createdAt}`),
  ],
);
