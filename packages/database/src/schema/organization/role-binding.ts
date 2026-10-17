import { Schema } from "effect";

import {
  OrganizationRoleBindingId,
  type OrganizationId,
  type OrganizationMemberId,
  type OrganizationRoleId,
} from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, foreignKey, index, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { organizationMember } from "#/schema/organization/member";
import { organizationRole } from "#/schema/organization/role";
import { organizationSchema } from "#/schema/organization/schema";

export const organizationRoleBinding = organizationSchema.table(
  "role_binding",
  {
    id: uuid("id")
      .$type<OrganizationRoleBindingId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(OrganizationRoleBindingId)(generateUuid7())),
    organizationId: uuid("organization_id").$type<OrganizationId>().notNull(),
    roleId: uuid("role_id").$type<OrganizationRoleId>().notNull(),
    memberId: uuid("member_id").$type<OrganizationMemberId>().notNull(),
    grantedByMemberId: uuid("granted_by_member_id").$type<OrganizationMemberId>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "role_binding_role_organization_fk",
      columns: [table.roleId, table.organizationId],
      foreignColumns: [organizationRole.id, organizationRole.organizationId],
    }).onDelete("restrict"),
    foreignKey({
      name: "role_binding_member_organization_fk",
      columns: [table.memberId, table.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
    foreignKey({
      name: "role_binding_granter_organization_fk",
      columns: [table.grantedByMemberId, table.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
    uniqueIndex("role_binding_active_uidx")
      .on(table.organizationId, table.roleId, table.memberId)
      .where(sql`${table.revokedAt} is null`),
    index("role_binding_member_idx").on(table.organizationId, table.memberId),
    index("role_binding_role_idx").on(table.organizationId, table.roleId),
    check("role_binding_revocation_check", sql`${table.revokedAt} >= ${table.createdAt}`),
  ],
);
