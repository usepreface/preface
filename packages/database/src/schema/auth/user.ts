import { Schema } from "effect";

import { UserId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { authSchema } from "#/schema/auth/schema";
import { timestampColumns } from "#/schema/timestamps";

export const user = authSchema.table(
  "user",
  {
    id: uuid("id")
      .$type<UserId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(UserId)(generateUuid7())),
    displayName: text("display_name").notNull(),
    email: text("email").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { mode: "date", withTimezone: true }),
    disabledAt: timestamp("disabled_at", { mode: "date", withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("user_email_uidx").on(table.email),
    check(
      "user_display_name_check",
      sql`${table.displayName} = btrim(${table.displayName}) and char_length(${table.displayName}) between 1 and 120`,
    ),
    check(
      "user_email_canonical_check",
      sql`${table.email} <> '' and ${table.email} = lower(btrim(${table.email}))`,
    ),
  ],
);
