import { Schema } from "effect";

import { AccountId, type UserId, type IdentityConnectionId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, index, text, timestamp, uniqueIndex, uuid, boolean } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { identityConnection } from "#/schema/auth/identity-connection";
import { authSchema } from "#/schema/auth/schema";
import { user } from "#/schema/auth/user";
import { timestampColumns } from "#/schema/timestamps";
export const account = authSchema.table(
  "account",
  {
    id: uuid("id")
      .$type<AccountId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(AccountId)(generateUuid7())),
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    identityConnectionId: uuid("identity_connection_id")
      .$type<IdentityConnectionId>()
      .notNull()
      .references(() => identityConnection.id, { onDelete: "restrict" }),
    issuer: text("issuer").notNull(),
    subject: text("subject").notNull(),
    providerEmail: text("provider_email"),
    providerEmailVerified: boolean("provider_email_verified"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    unlinkedAt: timestamp("unlinked_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (t) => [
    uniqueIndex("account_identity_uidx").on(t.identityConnectionId, t.issuer, t.subject),
    uniqueIndex("account_id_user_uidx").on(t.id, t.userId),
    uniqueIndex("account_active_user_connection_uidx")
      .on(t.userId, t.identityConnectionId)
      .where(sql`${t.unlinkedAt} is null`),
    index("account_user_idx").on(t.userId),
    check(
      "account_google_issuer_check",
      sql`${t.issuer} = 'https://accounts.google.com' and char_length(${t.subject}) between 1 and 255`,
    ),
  ],
);
