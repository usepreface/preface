import { Schema } from "effect";

import {
  InvitationAssignmentId,
  type TeamId,
  type OrganizationId,
  type OrganizationInvitationId,
  type OrganizationRoleId,
} from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, foreignKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { organizationInvitation } from "#/schema/organization/invitation";
import { organizationRole } from "#/schema/organization/role";
import { organizationSchema } from "#/schema/organization/schema";
import { team } from "#/schema/organization/team";

export const invitationAssignment = organizationSchema.table(
  "invitation_assignment",
  {
    id: uuid("id")
      .$type<InvitationAssignmentId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(InvitationAssignmentId)(generateUuid7())),
    organizationId: uuid("organization_id").$type<OrganizationId>().notNull(),
    invitationId: uuid("invitation_id").$type<OrganizationInvitationId>().notNull(),
    scopeKind: text("scope_kind")
      .$type<"organization" | "team">()
      .notNull()
      .default("organization"),
    teamId: uuid("team_id").$type<TeamId>(),
    roleId: uuid("role_id").$type<OrganizationRoleId>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "invitation_assignment_invitation_organization_fk",
      columns: [table.invitationId, table.organizationId],
      foreignColumns: [organizationInvitation.id, organizationInvitation.organizationId],
    }).onDelete("restrict"),
    foreignKey({
      name: "invitation_assignment_role_organization_fk",
      columns: [table.roleId, table.organizationId, table.scopeKind],
      foreignColumns: [
        organizationRole.id,
        organizationRole.organizationId,
        organizationRole.scopeKind,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "invitation_assignment_team_fk",
      columns: [table.teamId, table.organizationId],
      foreignColumns: [team.id, team.organizationId],
    }).onDelete("restrict"),
    check(
      "invitation_assignment_scope_check",
      sql`(${table.scopeKind} = 'organization' and ${table.teamId} is null) or (${table.scopeKind} = 'team' and ${table.teamId} is not null)`,
    ),
    uniqueIndex("invitation_assignment_role_uidx")
      .on(table.invitationId, table.roleId)
      .where(sql`${table.teamId} is null`),
    uniqueIndex("invitation_assignment_team_role_uidx")
      .on(table.invitationId, table.teamId, table.roleId)
      .where(sql`${table.teamId} is not null`),
  ],
);
