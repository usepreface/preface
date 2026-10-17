import { Schema } from "effect";

import { IdentityConnectionId } from "@usepreface/protocol";
import type { IdentityConnection } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateUuid7 } from "#/id";
import { authSchema } from "#/schema/auth/schema";
import { installation } from "#/schema/instance/installation";
import { timestampColumns } from "#/schema/timestamps";
export const identityConnection = authSchema.table(
  "identity_connection",
  {
    id: uuid("id")
      .$type<IdentityConnectionId>()
      .primaryKey()
      .$defaultFn(() => Schema.decodeSync(IdentityConnectionId)(generateUuid7())),
    installationId: smallint("installation_id")
      .$type<1>()
      .notNull()
      .references(() => installation.id, { onDelete: "restrict" }),
    provider: text("provider").$type<"google">().notNull(),
    name: text("name").notNull(),
    status: text("status").$type<IdentityConnection["status"]>().notNull(),
    revision: integer("revision").notNull(),
    configuration: jsonb("configuration").$type<IdentityConnection["configuration"]>().notNull(),
    secretsCiphertext: text("secrets_ciphertext").notNull(),
    testedRevision: integer("tested_revision"),
    testedAt: timestamp("tested_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (t) => [
    uniqueIndex("identity_connection_installation_provider_uidx").on(t.installationId, t.provider),
    check("identity_connection_provider_check", sql`${t.provider} = 'google'`),
    check(
      "identity_connection_status_check",
      sql`${t.status} in ('draft','tested','active','disabled') and ${t.revision} > 0 and (${t.testedRevision} is null or ${t.testedRevision} = ${t.revision}) and (${t.status} not in ('active','tested') or (${t.testedRevision} is not null and ${t.testedRevision} = ${t.revision} and ${t.testedAt} is not null))`,
    ),
  ],
);
