import { Schema } from "effect";

import { InstanceOwnerId, type UserId } from "@usepreface/protocol";
import type { InstanceOwnerGrantSource } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import { check, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { installation } from "#/schema/instance/installation";
import { instanceSchema } from "#/schema/instance/schema";

export const instanceOwner = instanceSchema.table(
  "owner",
  {
    id: uuid("id")
      .$type<InstanceOwnerId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(InstanceOwnerId)(generateUuid7())),
    installationId: smallint("installation_id")
      .$type<1>()
      .notNull()
      .default(1)
      .references(() => installation.id, { onDelete: "restrict" }),
    // Add restrictive user foreign keys with auth.user; no auth table exists yet.
    userId: uuid("user_id").$type<UserId>().notNull(),
    grantSource: text("grant_source").$type<InstanceOwnerGrantSource>().notNull(),
    grantedByUserId: uuid("granted_by_user_id").$type<UserId>(),
    grantedAt: timestamp("granted_at", { mode: "date", withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
    revokedByUserId: uuid("revoked_by_user_id").$type<UserId>(),
    revocationReason: text("revocation_reason"),
  },
  (table) => [
    uniqueIndex("owner_active_user_uidx")
      .on(table.userId)
      .where(sql`${table.revokedAt} is null`),
    uniqueIndex("owner_bootstrap_uidx")
      .on(table.installationId)
      .where(sql`${table.grantSource} = 'bootstrap'`),
    check(
      "owner_grant_source_check",
      sql`${table.grantSource} in ('bootstrap', 'owner', 'operator_recovery')`,
    ),
    check(
      "owner_grant_actor_check",
      sql`(${table.grantSource} = 'owner' and ${table.grantedByUserId} is not null)
    or (${table.grantSource} in ('bootstrap', 'operator_recovery') and ${table.grantedByUserId} is null)`,
    ),
    check("owner_revocation_time_check", sql`${table.revokedAt} >= ${table.grantedAt}`),
    check(
      "owner_revocation_metadata_check",
      sql`${table.revokedAt} is not null
    or (${table.revokedByUserId} is null and ${table.revocationReason} is null)`,
    ),
    check(
      "owner_revocation_reason_check",
      sql`${table.revocationReason} is null or ${table.revocationReason} <> ''`,
    ),
  ],
);
