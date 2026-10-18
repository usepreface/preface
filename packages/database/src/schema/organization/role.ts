import { Schema } from "effect";

import { OrganizationRoleId, type OrganizationId } from "@usepreface/protocol";
import type { OrganizationRole } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import { check, jsonb, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { organization } from "#/schema/organization/organization";
import { organizationSchema } from "#/schema/organization/schema";
import { timestampColumns } from "#/schema/timestamps";

export const organizationRole = organizationSchema.table(
  "role",
  {
    id: uuid("id")
      .$type<OrganizationRoleId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(OrganizationRoleId)(generateUuid7())),
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    scopeKind: text("scope_kind")
      .$type<OrganizationRole["scopeKind"]>()
      .notNull()
      .default("organization"),
    key: text("key").notNull(),
    name: text("name").notNull(),
    kind: text("kind").$type<OrganizationRole["kind"]>().notNull(),
    permissions: jsonb("permissions").$type<OrganizationRole["permissions"]>().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("role_organization_key_uidx").on(table.organizationId, table.scopeKind, table.key),
    uniqueIndex("role_id_organization_uidx").on(table.id, table.organizationId),
    uniqueIndex("role_id_organization_scope_uidx").on(
      table.id,
      table.organizationId,
      table.scopeKind,
    ),
    check(
      "role_kind_key_check",
      sql`(${table.kind} = 'builtin' and ${table.key} in ('owner', 'admin', 'member') and ${table.archivedAt} is null and (${table.key} <> 'owner' or ${table.scopeKind} = 'organization')) or (${table.kind} = 'custom' and ${table.key} not in ('owner', 'admin', 'member'))`,
    ),
    check(
      "role_permissions_check",
      sql`jsonb_typeof(${table.permissions}) = 'array' and ((${table.scopeKind} = 'organization' and ${table.permissions} <@ '["audit.read","organization.read","organization.update","organization.archive","members.read","members.manage","roles.read","roles.manage","roles.assign","teams.read","teams.manage"]'::jsonb) or (${table.scopeKind} = 'team' and ${table.permissions} <@ '["team.read","team.update","team.archive","team.members.read","team.members.manage","team.roles.read","team.roles.assign"]'::jsonb))`,
    ),
  ],
);
