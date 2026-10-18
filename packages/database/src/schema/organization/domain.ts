import type {
  IdentityConnectionId,
  OrganizationDomainId,
  OrganizationId,
  UserId,
} from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { identityConnection } from "#/schema/auth/identity-connection";
import { authSchema } from "#/schema/auth/schema";
import { user } from "#/schema/auth/user";
import { organization } from "#/schema/organization/organization";
import { organizationSchema } from "#/schema/organization/schema";

export const organizationDomain = organizationSchema.table(
  "domain",
  {
    id: uuid("id").$type<OrganizationDomainId>().primaryKey(),
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .notNull()
      .references(() => organization.id),
    domain: text("domain").notNull(),
    revision: integer("revision").notNull(),
    verificationMethod: text("verification_method").$type<"dns" | "operator">(),
    challengeHash: text("challenge_hash"),
    challengeExpiresAt: timestamp("challenge_expires_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedUntil: timestamp("verified_until", { withTimezone: true }),
    approvedByUserId: uuid("approved_by_user_id")
      .$type<UserId>()
      .references(() => user.id),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("domain_organization_name_uidx").on(t.organizationId, t.domain),
    uniqueIndex("domain_id_organization_uidx").on(t.id, t.organizationId),
    check("domain_revision_check", sql`${t.revision} > 0`),
    check("domain_name_check", sql`${t.domain} = lower(btrim(${t.domain}))`),
    check(
      "domain_challenge_check",
      sql`(${t.challengeHash} is null) = (${t.challengeExpiresAt} is null)`,
    ),
    check(
      "domain_verification_check",
      sql`(${t.verifiedAt} is null and ${t.verifiedUntil} is null and ${t.verificationMethod} is null) or (${t.verifiedAt} is not null and ${t.verifiedUntil} > ${t.verifiedAt} and ${t.verificationMethod} in ('dns','operator'))`,
    ),
    check(
      "domain_operator_check",
      sql`(${t.verificationMethod} = 'operator' and ${t.approvedByUserId} is not null) or (${t.verificationMethod} is distinct from 'operator' and ${t.approvedByUserId} is null)`,
    ),
  ],
);

export const identityConnectionDomain = authSchema.table(
  "identity_connection_domain",
  {
    identityConnectionId: uuid("identity_connection_id").$type<IdentityConnectionId>().notNull(),
    domainId: uuid("domain_id").$type<OrganizationDomainId>().notNull(),
    organizationId: uuid("organization_id").$type<OrganizationId>().notNull(),
    connectionRevision: integer("connection_revision").notNull(),
    domainRevision: integer("domain_revision").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.identityConnectionId, t.domainId] }),
    foreignKey({
      columns: [t.identityConnectionId, t.organizationId],
      foreignColumns: [identityConnection.id, identityConnection.organizationId],
    }),
    foreignKey({
      columns: [t.domainId, t.organizationId],
      foreignColumns: [organizationDomain.id, organizationDomain.organizationId],
    }),
    check(
      "connection_domain_revisions_check",
      sql`${t.connectionRevision} > 0 and ${t.domainRevision} > 0`,
    ),
  ],
);
