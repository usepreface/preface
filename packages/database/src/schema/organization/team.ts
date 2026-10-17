import { Schema } from "effect";

import {
  TeamId,
  type OrganizationId,
  type OrganizationMemberId,
  type TeamMetadata,
} from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, foreignKey, jsonb, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { organizationMember } from "#/schema/organization/member";
import { organization } from "#/schema/organization/organization";
import { organizationSchema } from "#/schema/organization/schema";
import { timestampColumns } from "#/schema/timestamps";
export const team = organizationSchema.table(
  "team",
  {
    id: uuid("id")
      .$type<TeamId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(TeamId)(generateUuid7())),
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    metadata: jsonb("metadata").$type<TeamMetadata>().notNull(),
    createdByMemberId: uuid("created_by_member_id").$type<OrganizationMemberId>().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("team_organization_slug_uidx").on(table.organizationId, table.slug),
    uniqueIndex("team_id_organization_uidx").on(table.id, table.organizationId),
    foreignKey({
      name: "team_creator_organization_fk",
      columns: [table.createdByMemberId, table.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
    check(
      "team_metadata_check",
      sql`jsonb_typeof(${table.metadata}) = 'object' and ${table.metadata} @> '{"version":1}'::jsonb and jsonb_typeof(${table.metadata}->'name') = 'string' and coalesce(char_length(${table.metadata}->>'name') between 1 and 120, false)`,
    ),
    check(
      "team_slug_check",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(${table.slug}) between 3 and 63`,
    ),
  ],
);
