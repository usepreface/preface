import { Schema } from "effect";

import { UserEmailId, type UserId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { boolean, check, index, timestamp, uniqueIndex, uuid, text } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { authSchema } from "#/schema/auth/schema";
import { user } from "#/schema/auth/user";
import { timestampColumns } from "#/schema/timestamps";

export const userEmail = authSchema.table(
  "user_email",
  {
    id: uuid("id")
      .$type<UserEmailId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(UserEmailId)(generateUuid7())),
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    loginEnabled: boolean("login_enabled").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("user_email_active_email_uidx")
      .on(table.email)
      .where(sql`${table.removedAt} is null`),
    uniqueIndex("user_email_primary_uidx")
      .on(table.userId)
      .where(sql`${table.removedAt} is null and ${table.isPrimary}`),
    uniqueIndex("user_email_id_user_unique").on(table.id, table.userId),
    index("user_email_user_idx").on(table.userId),
    check(
      "user_email_canonical_check",
      sql`${table.email} <> '' and ${table.email} = lower(btrim(${table.email}))`,
    ),
    check(
      "user_email_removed_check",
      sql`${table.removedAt} is null or (not ${table.isPrimary} and not ${table.loginEnabled})`,
    ),
    check(
      "user_email_login_verified_check",
      sql`not ${table.loginEnabled} or ${table.verifiedAt} is not null`,
    ),
  ],
);
