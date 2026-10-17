import type { IdentityConnectionId } from "@usepreface/protocol";
import { sql } from "drizzle-orm";
import { check, index, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { identityConnection } from "#/schema/auth/identity-connection";
import { authSchema } from "#/schema/auth/schema";

export const ssoReplay = authSchema.table(
  "sso_replay",
  {
    identityConnectionId: uuid("identity_connection_id")
      .$type<IdentityConnectionId>()
      .notNull()
      .references(() => identityConnection.id, { onDelete: "restrict" }),
    kind: text("kind").$type<"response" | "assertion">().notNull(),
    identifierHash: text("identifier_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.identityConnectionId, t.kind, t.identifierHash] }),
    index("sso_replay_expiry_idx").on(t.expiresAt),
    check("sso_replay_kind_check", sql`${t.kind} in ('response','assertion')`),
    check("sso_replay_expiry_check", sql`${t.expiresAt} > ${t.createdAt}`),
  ],
);
