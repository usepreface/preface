import type {
  AuthFlowId,
  IdentityConnectionId,
  SessionId,
  UserId,
  OrganizationId,
} from "@usepreface/protocol";
import type { AuthFlow } from "@usepreface/protocol/model";
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { identityConnection } from "#/schema/auth/identity-connection";
import { authSchema } from "#/schema/auth/schema";
import { session } from "#/schema/auth/session";
import { user } from "#/schema/auth/user";
import { organization } from "#/schema/organization/organization";
export const authFlow = authSchema.table(
  "auth_flow",
  {
    id: uuid("id").$type<AuthFlowId>().primaryKey(),
    provider: text("provider").$type<AuthFlow["provider"]>().notNull().default("google"),
    identityConnectionId: uuid("identity_connection_id")
      .$type<IdentityConnectionId>()
      .notNull()
      .references(() => identityConnection.id, { onDelete: "restrict" }),
    connectionRevision: integer("connection_revision").notNull(),
    requestedMaxAgeSeconds: integer("requested_max_age_seconds"),
    intent: text("intent").$type<AuthFlow["intent"]>().notNull(),
    initiatingSessionId: uuid("initiating_session_id").$type<SessionId>(),
    expectedUserId: uuid("expected_user_id")
      .$type<UserId>()
      .references(() => user.id, { onDelete: "restrict" }),
    targetOrganizationId: uuid("target_organization_id")
      .$type<OrganizationId>()
      .references(() => organization.id, { onDelete: "restrict" }),
    stateHash: text("state_hash").notNull(),
    browserBindingHash: text("browser_binding_hash").notNull(),
    nonceHash: text("nonce_hash"),
    samlRequestId: text("saml_request_id"),
    samlVerifiedCiphertext: text("saml_verified_ciphertext"),
    pkceVerifierCiphertext: text("pkce_verifier_ciphertext"),
    returnPath: text("return_path").$type<AuthFlow["returnPath"]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      columns: [t.initiatingSessionId, t.expectedUserId],
      foreignColumns: [session.id, session.userId],
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.identityConnectionId, t.provider],
      foreignColumns: [identityConnection.id, identityConnection.provider],
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.identityConnectionId, t.targetOrganizationId],
      foreignColumns: [identityConnection.id, identityConnection.organizationId],
    }).onDelete("restrict"),
    check("auth_flow_max_age_check", sql`${t.requestedMaxAgeSeconds} >= 0`),
    check(
      "auth_flow_owner_check",
      sql`(${t.provider} = 'google' and ${t.targetOrganizationId} is null) or (${t.provider} in ('oidc','saml') and ${t.targetOrganizationId} is not null)`,
    ),
    uniqueIndex("auth_flow_saml_request_uidx").on(t.samlRequestId),
    check(
      "auth_flow_protocol_check",
      sql`(${t.provider} = 'saml' and ${t.samlRequestId} is not null and ${t.nonceHash} is null and ${t.pkceVerifierCiphertext} is null) or (${t.provider} in ('google','oidc') and ${t.samlRequestId} is null and ${t.samlVerifiedCiphertext} is null and ${t.nonceHash} is not null)`,
    ),
    check(
      "auth_flow_saml_verified_check",
      sql`${t.samlVerifiedCiphertext} is null or (${t.claimedAt} is not null and ${t.consumedAt} is null and ${t.revokedAt} is null)`,
    ),
    uniqueIndex("auth_flow_state_uidx").on(t.stateHash),
    index("auth_flow_connection_idx").on(t.identityConnectionId),
    index("auth_flow_expiry_idx").on(t.expiresAt),
    check(
      "auth_flow_intent_check",
      sql`(${t.intent} = 'sign_in' and ${t.initiatingSessionId} is null and ${t.expectedUserId} is null) or (${t.intent} in ('link','reauthenticate','test') and ${t.initiatingSessionId} is not null and ${t.expectedUserId} is not null)`,
    ),
    check(
      "auth_flow_lifecycle_check",
      sql`${t.connectionRevision} > 0 and ${t.expiresAt} > ${t.createdAt} and not (${t.consumedAt} is not null and ${t.revokedAt} is not null) and (${t.consumedAt} is null or ${t.claimedAt} is not null) and ((${t.consumedAt} is null and ${t.revokedAt} is null) or ${t.pkceVerifierCiphertext} is null)`,
    ),
    check("auth_flow_return_path_check", sql`${t.returnPath} = '/api/docs'`),
  ],
);
