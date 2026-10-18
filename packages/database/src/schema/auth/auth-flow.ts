import type {
  AuthFlowId,
  IdentityConnectionId,
  SessionId,
  UserId,
  OrganizationId,
  OrganizationInvitationId,
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
import { organizationInvitation } from "#/schema/organization/invitation";
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
    connectionOrganizationId: uuid("connection_organization_id").$type<OrganizationId>(),
    invitationId: uuid("invitation_id").$type<OrganizationInvitationId>(),
    invitationRevision: integer("invitation_revision"),
    displayName: text("display_name"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    stateHash: text("state_hash").notNull(),
    browserBindingHash: text("browser_binding_hash").notNull(),
    nonceHash: text("nonce_hash"),
    samlRequestId: text("saml_request_id"),
    verifiedIdentityCiphertext: text("verified_identity_ciphertext"),
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
      columns: [t.identityConnectionId, t.connectionOrganizationId],
      foreignColumns: [identityConnection.id, identityConnection.organizationId],
    }).onDelete("restrict"),
    foreignKey({
      columns: [t.invitationId, t.targetOrganizationId],
      foreignColumns: [organizationInvitation.id, organizationInvitation.organizationId],
    }),
    check(
      "auth_flow_invitation_check",
      sql`(${t.intent} = 'accept_invitation' and ${t.invitationId} is not null and ${t.invitationRevision} > 0 and ${t.targetOrganizationId} is not null and ${t.displayName} is not null) or (${t.intent} <> 'accept_invitation' and ${t.invitationId} is null and ${t.invitationRevision} is null)`,
    ),
    check("auth_flow_max_age_check", sql`${t.requestedMaxAgeSeconds} >= 0`),
    check(
      "auth_flow_owner_check",
      sql`(${t.provider} = 'google' and ${t.connectionOrganizationId} is null and (${t.targetOrganizationId} is null or ${t.intent} = 'accept_invitation')) or (${t.provider} in ('oidc','saml') and ${t.targetOrganizationId} is not null and ${t.connectionOrganizationId} = ${t.targetOrganizationId})`,
    ),
    uniqueIndex("auth_flow_saml_request_uidx").on(t.samlRequestId),
    check(
      "auth_flow_protocol_check",
      sql`(${t.provider} = 'saml' and ${t.samlRequestId} is not null and ${t.nonceHash} is null and ${t.pkceVerifierCiphertext} is null) or (${t.provider} in ('google','oidc') and ${t.samlRequestId} is null and ${t.nonceHash} is not null)`,
    ),
    check(
      "auth_flow_saml_verified_check",
      sql`${t.verifiedIdentityCiphertext} is null or (${t.claimedAt} is not null and ${t.consumedAt} is null and ${t.revokedAt} is null)`,
    ),
    uniqueIndex("auth_flow_state_uidx").on(t.stateHash),
    index("auth_flow_connection_idx").on(t.identityConnectionId),
    index("auth_flow_expiry_idx").on(t.expiresAt),
    check(
      "auth_flow_intent_check",
      sql`(${t.intent} = 'sign_in' and ${t.initiatingSessionId} is null and ${t.expectedUserId} is null) or (${t.intent} = 'accept_invitation' and ((${t.initiatingSessionId} is null and ${t.expectedUserId} is null) or (${t.initiatingSessionId} is not null and ${t.expectedUserId} is not null))) or (${t.intent} in ('link','reauthenticate','test') and ${t.initiatingSessionId} is not null and ${t.expectedUserId} is not null)`,
    ),
    check(
      "auth_flow_lifecycle_check",
      sql`${t.connectionRevision} > 0 and ${t.expiresAt} > ${t.createdAt} and not (${t.consumedAt} is not null and ${t.revokedAt} is not null) and (${t.consumedAt} is null or ${t.claimedAt} is not null) and ((${t.consumedAt} is null and ${t.revokedAt} is null) or ${t.pkceVerifierCiphertext} is null)`,
    ),
    check(
      "auth_flow_return_path_check",
      sql`left(${t.returnPath}, 1) = '/' and left(${t.returnPath}, 2) <> '//' and length(${t.returnPath}) <= 2048`,
    ),
  ],
);
