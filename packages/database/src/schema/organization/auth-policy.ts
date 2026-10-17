import type { OrganizationId, OrganizationMemberId } from "@usepreface/protocol";
import type { OrganizationAuthPolicy } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import { check, foreignKey, integer, jsonb, uuid } from "drizzle-orm/pg-core";

import { organizationMember } from "#/schema/organization/member";
import { organization } from "#/schema/organization/organization";
import { organizationSchema } from "#/schema/organization/schema";
import { timestampColumns } from "#/schema/timestamps";

export const organizationAuthPolicy = organizationSchema.table(
  "auth_policy",
  {
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .primaryKey()
      .references(() => organization.id, { onDelete: "restrict" }),
    revision: integer("revision").notNull().default(1),
    allowedMethods: jsonb("allowed_methods")
      .$type<OrganizationAuthPolicy["allowedMethods"]>()
      .notNull(),
    updatedByMemberId: uuid("updated_by_member_id").$type<OrganizationMemberId>().notNull(),
    ...timestampColumns(),
  },
  (table) => [
    foreignKey({
      name: "auth_policy_updater_organization_fk",
      columns: [table.updatedByMemberId, table.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
    check("auth_policy_revision_check", sql`${table.revision} > 0`),
    check(
      "auth_policy_methods_check",
      sql`jsonb_typeof(${table.allowedMethods}) = 'array' and jsonb_array_length(${table.allowedMethods}) > 0 and ${table.allowedMethods} <@ '["email_code","email_link","google"]'::jsonb`,
    ),
  ],
);
