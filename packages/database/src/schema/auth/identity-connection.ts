import { Schema } from "effect";

import { IdentityConnectionId, type OrganizationId } from "@usepreface/protocol";
import type { IdentityConnection } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import {
  check,
  index,
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
import { organization } from "#/schema/organization/organization";
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
      .references(() => installation.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id")
      .$type<OrganizationId>()
      .references(() => organization.id, { onDelete: "restrict" }),
    provider: text("provider").$type<IdentityConnection["provider"]>().notNull(),
    name: text("name").notNull(),
    status: text("status").$type<IdentityConnection["status"]>().notNull(),
    revision: integer("revision").notNull(),
    configuration: jsonb("configuration").$type<IdentityConnection["configuration"]>().notNull(),
    secretsCiphertext: text("secrets_ciphertext").notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    testedRevision: integer("tested_revision"),
    testedAt: timestamp("tested_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (t) => [
    uniqueIndex("identity_connection_installation_provider_uidx")
      .on(t.installationId, t.provider)
      .where(sql`${t.installationId} is not null`),
    uniqueIndex("identity_connection_id_organization_uidx").on(t.id, t.organizationId),
    uniqueIndex("identity_connection_id_provider_uidx").on(t.id, t.provider),
    index("identity_connection_organization_idx").on(t.organizationId, t.id),
    check(
      "identity_connection_provider_check",
      sql`(${t.provider} = 'google' and ${t.installationId} is not null and ${t.installationId} = 1 and ${t.organizationId} is null) or (${t.provider} = 'oidc' and ${t.installationId} is null and ${t.organizationId} is not null)`,
    ),
    check(
      "identity_connection_status_check",
      sql`${t.status} in ('draft','tested','active','disabled') and ${t.revision} > 0 and (${t.testedRevision} is null or ${t.testedRevision} = ${t.revision}) and (${t.status} not in ('active','tested') or (${t.testedRevision} is not null and ${t.testedRevision} = ${t.revision} and ${t.testedAt} is not null))`,
    ),
  ],
);
