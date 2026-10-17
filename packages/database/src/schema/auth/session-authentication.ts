import { Schema } from "effect";

import {
  SessionAuthenticationId,
  type AccountId,
  type SessionId,
  type UserEmailId,
  type UserId,
} from "@usepreface/protocol";
import type { SessionAuthentication } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { account } from "#/schema/auth/account";
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
    userEmailId: uuid("user_email_id").$type<UserEmailId>(),
    accountId: uuid("account_id").$type<AccountId>(),
    connectionRevision: integer("connection_revision"),
    method: text("method").$type<SessionAuthentication["method"]>().notNull(),
    providerAuthenticatedAt: timestamp("provider_authenticated_at", { withTimezone: true }),
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
    foreignKey({
      columns: [table.accountId, table.userId],
      foreignColumns: [account.id, account.userId],
    }).onDelete("restrict"),
    index("session_authentication_account_idx").on(table.accountId),
    index("session_authentication_session_idx").on(table.sessionId),
    check(
      "session_authentication_method_check",
      sql`(${table.method} in ('bootstrap_email_code', 'email_code', 'email_link') and ${table.userEmailId} is not null and ${table.accountId} is null and ${table.connectionRevision} is null) or (${table.method} in ('google','oidc','saml') and ${table.userEmailId} is null and ${table.accountId} is not null and ${table.connectionRevision} is not null and ${table.connectionRevision} > 0)`,
    ),
    check(
      "session_authentication_provider_time_check",
      sql`${table.providerAuthenticatedAt} is null or ${table.method} in ('oidc','saml')`,
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
      sql`(${table.method} in ('google','oidc','saml') and ${table.assurance} = jsonb_build_object('version',1,'provider',${table.method})) or (${table.method} in ('bootstrap_email_code','email_code','email_link') and ${table.assurance} = '{"version":1,"emailVerified":true}'::jsonb)`,
    ),
  ],
);
