import type {
  OrganizationId,
  OrganizationInvitationId,
  OrganizationMemberId,
  UserId,
  EmailJobId,
} from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, foreignKey, index, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { user } from "#/schema/auth/user";
import { emailJob } from "#/schema/jobs/email";
import { organizationMember } from "#/schema/organization/member";
import { organization } from "#/schema/organization/organization";
import { organizationSchema } from "#/schema/organization/schema";
import { timestampColumns } from "#/schema/timestamps";

export const organizationInvitation = organizationSchema.table(
  "invitation",
  {
    id: uuid("id").$type<OrganizationInvitationId>().primaryKey(),
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    invitedByMemberId: uuid("invited_by_member_id").$type<OrganizationMemberId>().notNull(),
    tokenHash: text("token_hash").notNull(),
    emailJobId: uuid("email_job_id")
      .$type<EmailJobId>()
      .notNull()
      .references(() => emailJob.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByUserId: uuid("accepted_by_user_id")
      .$type<UserId>()
      .references(() => user.id, { onDelete: "restrict" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    foreignKey({
      name: "invitation_inviter_organization_fk",
      columns: [table.invitedByMemberId, table.organizationId],
      foreignColumns: [organizationMember.id, organizationMember.organizationId],
    }).onDelete("restrict"),
    uniqueIndex("invitation_id_organization_uidx").on(table.id, table.organizationId),
    uniqueIndex("invitation_token_uidx").on(table.tokenHash),
    uniqueIndex("invitation_pending_recipient_uidx")
      .on(table.organizationId, table.email)
      .where(sql`${table.acceptedAt} is null and ${table.revokedAt} is null`),
    index("invitation_organization_idx").on(table.organizationId, table.id),
    index("invitation_expiry_idx").on(table.expiresAt),
    check("invitation_email_check", sql`${table.email} = lower(btrim(${table.email}))`),
    check("invitation_digest_check", sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`),
    check("invitation_expiry_check", sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      "invitation_lifecycle_check",
      sql`(${table.acceptedAt} is null) = (${table.acceptedByUserId} is null) and not (${table.acceptedAt} is not null and ${table.revokedAt} is not null) and (${table.acceptedAt} is null or ${table.acceptedAt} >= ${table.createdAt}) and (${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt})`,
    ),
  ],
);
