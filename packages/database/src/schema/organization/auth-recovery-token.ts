import { Schema } from "effect";

import {
  OrganizationAuthRecoveryTokenId,
  type OrganizationId,
  type OrganizationMemberId,
} from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, foreignKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { organizationMember } from "#/schema/organization/member";
import { organizationSchema } from "#/schema/organization/schema";

export const organizationAuthRecoveryToken = organizationSchema.table(
  "auth_recovery_token",
  {
    id: uuid("id")
      .$type<OrganizationAuthRecoveryTokenId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(OrganizationAuthRecoveryTokenId)(generateUuid7())),
    organizationId: uuid("organization_id").$type<OrganizationId>().notNull(),
    memberId: uuid("member_id").$type<OrganizationMemberId>().notNull(),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      columns: [t.memberId, t.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
    uniqueIndex("auth_recovery_token_active_member_uidx")
      .on(t.organizationId, t.memberId)
      .where(sql`${t.consumedAt} is null and ${t.revokedAt} is null`),
    check(
      "auth_recovery_token_lifecycle_check",
      sql`not (${t.consumedAt} is not null and ${t.revokedAt} is not null) and (${t.consumedAt} is null or ${t.consumedAt} >= ${t.createdAt}) and (${t.revokedAt} is null or ${t.revokedAt} >= ${t.createdAt})`,
    ),
  ],
);
