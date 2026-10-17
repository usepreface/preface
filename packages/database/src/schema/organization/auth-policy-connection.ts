import type {
  IdentityConnectionId,
  OrganizationId,
  OrganizationMemberId,
} from "@usepreface/protocol";
import { foreignKey, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { identityConnection } from "#/schema/auth/identity-connection";
import { organizationAuthPolicy } from "#/schema/organization/auth-policy";
import { organizationMember } from "#/schema/organization/member";
import { organizationSchema } from "#/schema/organization/schema";

export const organizationAuthPolicyConnection = organizationSchema.table(
  "auth_policy_connection",
  {
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .notNull()
      .references(() => organizationAuthPolicy.organizationId, { onDelete: "restrict" }),
    identityConnectionId: uuid("identity_connection_id").$type<IdentityConnectionId>().notNull(),
    createdByMemberId: uuid("created_by_member_id").$type<OrganizationMemberId>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.identityConnectionId] }),
    foreignKey({
      columns: [t.identityConnectionId, t.organizationId],
      foreignColumns: [identityConnection.id, identityConnection.organizationId],
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.createdByMemberId, t.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
  ],
);
