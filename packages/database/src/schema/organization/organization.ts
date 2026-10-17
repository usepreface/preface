import { Schema } from "effect";

import { OrganizationId, type UserId, type OrganizationMetadata } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, index, jsonb, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { user } from "#/schema/auth/user";
import { organizationSchema } from "#/schema/organization/schema";
import { timestampColumns } from "#/schema/timestamps";

export const organization = organizationSchema.table(
  "organization",
  {
    id: uuid("id")
      .$type<OrganizationId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(OrganizationId)(generateUuid7())),
    metadata: jsonb("metadata").$type<OrganizationMetadata>().notNull(),
    slug: text("slug").notNull(),
    createdByUserId: uuid("created_by_user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("organization_slug_uidx").on(table.slug),
    index("organization_creator_idx").on(table.createdByUserId),
    check(
      "organization_metadata_check",
      sql`jsonb_typeof(${table.metadata}) = 'object' and ${table.metadata} @> '{"version":1}'::jsonb and jsonb_typeof(${table.metadata}->'name') = 'string' and coalesce(char_length(${table.metadata}->>'name') between 1 and 120, false)`,
    ),
    check(
      "organization_slug_check",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(${table.slug}) between 3 and 63`,
    ),
  ],
);
