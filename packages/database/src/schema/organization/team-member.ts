import { Schema } from "effect";

import {
  TeamMemberId,
  type TeamId,
  type OrganizationId,
  type OrganizationMemberId,
} from "@usepreface/protocol";
import { foreignKey, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { organizationMember } from "#/schema/organization/member";
import { organizationSchema } from "#/schema/organization/schema";
import { team } from "#/schema/organization/team";
import { timestampColumns } from "#/schema/timestamps";
export const teamMember = organizationSchema.table(
  "team_member",
  {
    id: uuid("id")
      .$type<TeamMemberId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(TeamMemberId)(generateUuid7())),
    organizationId: uuid("organization_id").$type<OrganizationId>().notNull(),
    teamId: uuid("team_id").$type<TeamId>().notNull(),
    memberId: uuid("member_id").$type<OrganizationMemberId>().notNull(),
    addedByMemberId: uuid("added_by_member_id").$type<OrganizationMemberId>().notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("team_member_identity_uidx").on(table.organizationId, table.teamId, table.memberId),
    foreignKey({
      name: "team_member_team_organization_fk",
      columns: [table.teamId, table.organizationId],
      foreignColumns: [team.id, team.organizationId],
    }).onDelete("restrict"),
    foreignKey({
      name: "team_member_member_organization_fk",
      columns: [table.memberId, table.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
    foreignKey({
      name: "team_member_actor_organization_fk",
      columns: [table.addedByMemberId, table.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
  ],
);
