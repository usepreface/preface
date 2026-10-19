import type { BootstrapChallengeId, EmailJobId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, integer, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { installation } from "#/schema/instance/installation";
import { instanceSchema } from "#/schema/instance/schema";
import { emailJob } from "#/schema/jobs/email";

export const bootstrapChallenge = instanceSchema.table(
  "bootstrap_challenge",
  {
    id: uuid("id").$type<BootstrapChallengeId>().primaryKey(),
    installationId: smallint("installation_id")
      .$type<1>()
      .notNull()
      .default(1)
      .references(() => installation.id, { onDelete: "restrict" }),
    bootstrapTokenHash: text("bootstrap_token_hash").notNull(),
    organizationName: text("organization_name").notNull(),
    ownerName: text("owner_name").notNull(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    emailJobId: uuid("email_job_id")
      .$type<EmailJobId>()
      .notNull()
      .references(() => emailJob.id, { onDelete: "restrict" }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("bootstrap_challenge_installation_unique").on(table.installationId),
    check("bootstrap_challenge_attempts_check", sql`${table.attempts} between 0 and 5`),
    check("bootstrap_challenge_expiry_check", sql`${table.expiresAt} > ${table.createdAt}`),
  ],
);
