import { Schema } from "effect";

import type { UserMetadata } from "@usepreface/protocol";
import { UserId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

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
    metadata: jsonb("metadata").$type<UserMetadata>().notNull(),
    disabledAt: timestamp("disabled_at", { mode: "date", withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    check(
      "user_metadata_check",
      sql`jsonb_typeof(${table.metadata}) = 'object' and ${table.metadata} @> '{"version":1}'::jsonb and jsonb_typeof(${table.metadata}->'name') = 'string' and coalesce(char_length(${table.metadata}->>'name') between 1 and 120, false)`,
    ),
  ],
);
