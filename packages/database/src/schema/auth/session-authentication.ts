import { Schema } from "effect";

import {
  SessionAuthenticationId,
  type SessionId,
  type UserEmailId,
  type UserId,
} from "@usepreface/protocol";
import type { SessionAuthentication } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import { check, foreignKey, index, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { authSchema } from "#/schema/auth/schema";
import { session } from "#/schema/auth/session";
import { userEmail } from "#/schema/auth/user-email";

export const sessionAuthentication = authSchema.table(
  "session_authentication",
  {
    id: uuid("id")
      .$type<SessionAuthenticationId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(SessionAuthenticationId)(generateUuid7())),
    sessionId: uuid("session_id").$type<SessionId>().notNull(),
    userId: uuid("user_id").$type<UserId>().notNull(),
    userEmailId: uuid("user_email_id").$type<UserEmailId>().notNull(),
    method: text("method").$type<SessionAuthentication["method"]>().notNull(),
    authenticatedAt: timestamp("authenticated_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    assurance: jsonb("assurance").$type<SessionAuthentication["assurance"]>().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.sessionId, table.userId],
      foreignColumns: [session.id, session.userId],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.userEmailId, table.userId],
      foreignColumns: [userEmail.id, userEmail.userId],
    }).onDelete("restrict"),
    index("session_authentication_session_idx").on(table.sessionId),
    check(
      "session_authentication_method_check",
      sql`${table.method} in ('bootstrap_email_code', 'email_code', 'email_link')`,
    ),
    check(
      "session_authentication_expiry_check",
      sql`${table.expiresAt} > ${table.authenticatedAt}`,
    ),
    check(
      "session_authentication_revocation_check",
      sql`${table.revokedAt} >= ${table.authenticatedAt}`,
    ),
    check(
      "session_authentication_assurance_check",
      sql`${table.assurance} = '{"version":1,"emailVerified":true}'::jsonb`,
    ),
  ],
);
