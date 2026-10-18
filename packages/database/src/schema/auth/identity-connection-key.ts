import type {
  IdentityConnectionKeyId,
  IdentityConnectionId,
  OrganizationId,
} from "@usepreface/protocol";
import type { IdentityConnectionKey } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { identityConnection } from "#/schema/auth/identity-connection";
import { authSchema } from "#/schema/auth/schema";

export const identityConnectionKey = authSchema.table(
  "identity_connection_key",
  {
    id: uuid("id").$type<IdentityConnectionKeyId>().primaryKey(),
    identityConnectionId: uuid("identity_connection_id").$type<IdentityConnectionId>().notNull(),
    organizationId: uuid("organization_id").$type<OrganizationId>().notNull(),
    connectionRevision: integer("connection_revision").notNull(),
    certificate: text("certificate").notNull(),
    privateKeyCiphertext: text("private_key_ciphertext"),
    status: text("status").$type<IdentityConnectionKey["status"]>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    testedAt: timestamp("tested_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      columns: [t.identityConnectionId, t.organizationId],
      foreignColumns: [identityConnection.id, identityConnection.organizationId],
    }),
    uniqueIndex("connection_key_id_connection_uidx").on(t.id, t.identityConnectionId),
    uniqueIndex("connection_key_pending_uidx")
      .on(t.identityConnectionId)
      .where(sql`${t.status} = 'pending'`),
    index("connection_key_connection_idx").on(t.identityConnectionId),
    check(
      "connection_key_status_check",
      sql`${t.status} in ('pending','activated','retiring','retired')`,
    ),
    check("connection_key_revision_check", sql`${t.connectionRevision} > 0`),
    check(
      "connection_key_secret_check",
      sql`(${t.status} = 'pending' and ${t.privateKeyCiphertext} is not null) or (${t.status} <> 'pending' and ${t.privateKeyCiphertext} is null)`,
    ),
    check(
      "connection_key_retired_check",
      sql`(${t.status} = 'retired') = (${t.retiredAt} is not null)`,
    ),
  ],
);
