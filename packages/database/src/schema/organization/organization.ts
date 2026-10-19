import { Schema } from "effect";

import { OrganizationId, type UserId, type OrganizationMetadata } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, index, jsonb, smallint, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { user } from "#/schema/auth/user";
import { installation } from "#/schema/instance/installation";
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
    installationId: smallint("installation_id")
      .$type<1>()
      .notNull()
      .default(1)
      .references(() => installation.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("organization_installation_uidx").on(table.installationId),
    check("organization_singleton_check", sql`${table.installationId} = 1`),
    index("organization_creator_idx").on(table.createdByUserId),
    check(
      "organization_metadata_check",
      sql`jsonb_typeof(${table.metadata}) = 'object' and ${table.metadata} @> '{"version":1}'::jsonb and jsonb_typeof(${table.metadata}->'name') = 'string' and coalesce(char_length(${table.metadata}->>'name') between 1 and 120, false)`,
    ),
  ],
);
