import { Schema } from "effect";

import { InstallationId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { instanceSchema } from "#/schema/instance/schema";

export const installation = instanceSchema.table(
  "installation",
  {
    id: smallint("id").$type<1>().primaryKey().default(1),
    installationId: uuid("installation_id")
      .$type<InstallationId>()
      .notNull()
      .unique("installation_identity_unique")
      .$defaultFn(() => Schema.decodeSync(InstallationId)(generateUuid7())),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
    bootstrapCompletedAt: timestamp("bootstrap_completed_at", { mode: "date", withTimezone: true }),
    bootstrapTokenHash: text("bootstrap_token_hash"),
    bootstrapTokenIssuedAt: timestamp("bootstrap_token_issued_at", {
      mode: "date",
      withTimezone: true,
    }),
    bootstrapTokenExpiresAt: timestamp("bootstrap_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (table) => [
    check("installation_singleton_check", sql`${table.id} = 1`),
    check(
      "installation_token_fields_check",
      sql`
    (${table.bootstrapTokenHash} is null and ${table.bootstrapTokenIssuedAt} is null and ${table.bootstrapTokenExpiresAt} is null)
    or (${table.bootstrapTokenHash} is not null and ${table.bootstrapTokenHash} <> ''
      and ${table.bootstrapTokenIssuedAt} is not null and ${table.bootstrapTokenExpiresAt} is not null)`,
    ),
    check(
      "installation_token_expiry_check",
      sql`${table.bootstrapTokenExpiresAt} > ${table.bootstrapTokenIssuedAt}`,
    ),
    check(
      "installation_completed_token_check",
      sql`${table.bootstrapCompletedAt} is null or ${table.bootstrapTokenHash} is null`,
    ),
  ],
);
