import type { UserId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { authSchema } from "#/schema/auth/schema";
import { user } from "#/schema/auth/user";

export const passwordCredential = authSchema.table(
  "password_credential",
  {
    userId: uuid("user_id")
      .$type<UserId>()
      .primaryKey()
      .references(() => user.id, { onDelete: "restrict" }),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    passwordChangedAt: timestamp("password_changed_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    check("password_credential_hash_check", sql`${table.passwordHash} <> ''`),
    check(
      "password_credential_change_time_check",
      sql`${table.passwordChangedAt} >= ${table.createdAt}`,
    ),
  ],
);
