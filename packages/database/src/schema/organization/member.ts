import { Schema } from "effect";

import { OrganizationMemberId, type OrganizationId, type UserId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { user } from "#/schema/auth/user";
import { organization } from "#/schema/organization/organization";
import { organizationSchema } from "#/schema/organization/schema";
import { timestampColumns } from "#/schema/timestamps";

export const organizationMember = organizationSchema.table(
  "member",
  {
    id: uuid("id")
      .$type<OrganizationMemberId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(OrganizationMemberId)(generateUuid7())),
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .$type<UserId>()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull(),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("member_organization_user_uidx").on(table.organizationId, table.userId),
    uniqueIndex("member_id_organization_uidx").on(table.id, table.organizationId),
    index("member_user_idx").on(table.userId),
    check(
      "member_lifecycle_check",
      sql`(${table.suspendedAt} is null or ${table.suspendedAt} >= ${table.joinedAt}) and (${table.removedAt} is null or ${table.removedAt} >= ${table.joinedAt}) and (${table.removedAt} is null or ${table.suspendedAt} is null)`,
    ),
  ],
);
