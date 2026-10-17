import { Schema } from "effect";

import {
  InvitationAssignmentId,
  type OrganizationId,
  type OrganizationInvitationId,
  type OrganizationRoleId,
} from "@usepreface/protocol";
import { foreignKey, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { organizationInvitation } from "#/schema/organization/invitation";
import { organizationRole } from "#/schema/organization/role";
import { organizationSchema } from "#/schema/organization/schema";

export const invitationAssignment = organizationSchema.table(
  "invitation_assignment",
  {
    id: uuid("id")
      .$type<InvitationAssignmentId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(InvitationAssignmentId)(generateUuid7())),
    organizationId: uuid("organization_id").$type<OrganizationId>().notNull(),
    invitationId: uuid("invitation_id").$type<OrganizationInvitationId>().notNull(),
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
      columns: [table.roleId, table.organizationId],
      foreignColumns: [organizationRole.id, organizationRole.organizationId],
    }).onDelete("restrict"),
    uniqueIndex("invitation_assignment_role_uidx").on(table.invitationId, table.roleId),
  ],
);
