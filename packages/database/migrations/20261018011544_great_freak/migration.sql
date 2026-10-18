CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "instance";
--> statement-breakpoint
CREATE SCHEMA "jobs";
--> statement-breakpoint
CREATE SCHEMA "organization";
--> statement-breakpoint
CREATE TABLE "auth"."account" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"identity_connection_id" uuid NOT NULL,
	"issuer" text NOT NULL,
	"subject" text NOT NULL,
	"provider_email" text,
	"provider_email_verified" boolean,
	"last_used_at" timestamp with time zone,
	"unlinked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_identity_check" CHECK (char_length("issuer") between 1 and 2048 and char_length("subject") between 1 and 255)
);
--> statement-breakpoint
CREATE TABLE "audit"."event" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid,
	"event_type" text NOT NULL,
	"actor_kind" text NOT NULL,
	"actor_user_id" uuid,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "event_actor_kind_check" CHECK ("actor_kind" in ('user', 'system')),
	CONSTRAINT "event_actor_attribution_check" CHECK (("actor_kind" = 'user' and "actor_user_id" is not null)
        or ("actor_kind" = 'system' and "actor_user_id" is null)),
	CONSTRAINT "event_type_check" CHECK (btrim("event_type") <> ''),
	CONSTRAINT "event_target_type_check" CHECK (btrim("target_type") <> ''),
	CONSTRAINT "event_metadata_object_check" CHECK (jsonb_typeof("metadata") = 'object')
);
--> statement-breakpoint
CREATE TABLE "auth"."auth_flow" (
	"id" uuid PRIMARY KEY,
	"provider" text DEFAULT 'google' NOT NULL,
	"identity_connection_id" uuid NOT NULL,
	"connection_revision" integer NOT NULL,
	"requested_max_age_seconds" integer,
	"intent" text NOT NULL,
	"initiating_session_id" uuid,
	"expected_user_id" uuid,
	"target_organization_id" uuid,
	"connection_organization_id" uuid,
	"invitation_id" uuid,
	"invitation_revision" integer,
	"display_name" text,
	"email_verified_at" timestamp with time zone,
	"state_hash" text NOT NULL,
	"browser_binding_hash" text NOT NULL,
	"nonce_hash" text,
	"saml_request_id" text,
	"verified_identity_ciphertext" text,
	"pkce_verifier_ciphertext" text,
	"return_path" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "auth_flow_invitation_check" CHECK (("intent" = 'accept_invitation' and "invitation_id" is not null and "invitation_revision" > 0 and "target_organization_id" is not null and "display_name" is not null) or ("intent" <> 'accept_invitation' and "invitation_id" is null and "invitation_revision" is null)),
	CONSTRAINT "auth_flow_max_age_check" CHECK ("requested_max_age_seconds" >= 0),
	CONSTRAINT "auth_flow_owner_check" CHECK (("provider" = 'google' and "connection_organization_id" is null and ("target_organization_id" is null or "intent" = 'accept_invitation')) or ("provider" in ('oidc','saml') and "target_organization_id" is not null and "connection_organization_id" = "target_organization_id")),
	CONSTRAINT "auth_flow_protocol_check" CHECK (("provider" = 'saml' and "saml_request_id" is not null and "nonce_hash" is null and "pkce_verifier_ciphertext" is null) or ("provider" in ('google','oidc') and "saml_request_id" is null and "nonce_hash" is not null)),
	CONSTRAINT "auth_flow_saml_verified_check" CHECK ("verified_identity_ciphertext" is null or ("claimed_at" is not null and "consumed_at" is null and "revoked_at" is null)),
	CONSTRAINT "auth_flow_intent_check" CHECK (("intent" = 'sign_in' and "initiating_session_id" is null and "expected_user_id" is null) or ("intent" = 'accept_invitation' and (("initiating_session_id" is null and "expected_user_id" is null) or ("initiating_session_id" is not null and "expected_user_id" is not null))) or ("intent" in ('link','reauthenticate','test') and "initiating_session_id" is not null and "expected_user_id" is not null)),
	CONSTRAINT "auth_flow_lifecycle_check" CHECK ("connection_revision" > 0 and "expires_at" > "created_at" and not ("consumed_at" is not null and "revoked_at" is not null) and ("consumed_at" is null or "claimed_at" is not null) and (("consumed_at" is null and "revoked_at" is null) or "pkce_verifier_ciphertext" is null)),
	CONSTRAINT "auth_flow_return_path_check" CHECK (left("return_path", 1) = '/' and left("return_path", 2) <> '//' and length("return_path") <= 2048)
);
--> statement-breakpoint
CREATE TABLE "instance"."bootstrap_challenge" (
	"id" uuid PRIMARY KEY,
	"installation_id" smallint DEFAULT 1 NOT NULL,
	"bootstrap_token_hash" text NOT NULL,
	"instance_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"email_job_id" uuid NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "bootstrap_challenge_attempts_check" CHECK ("attempts" between 0 and 5),
	CONSTRAINT "bootstrap_challenge_expiry_check" CHECK ("expires_at" > "created_at")
);
--> statement-breakpoint
CREATE TABLE "jobs"."email" (
	"id" uuid PRIMARY KEY,
	"type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"payload_fingerprint" text NOT NULL,
	"encrypted_payload" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"lease_token" text,
	"lease_expires_at" timestamp with time zone,
	"last_error_code" text,
	"provider" text,
	"provider_message_id" text,
	"sent_at" timestamp with time zone,
	CONSTRAINT "email_status_check" CHECK ("status" in ('pending', 'processing', 'sent', 'failed', 'expired', 'cancelled')),
	CONSTRAINT "email_attempts_check" CHECK ("attempts" >= 0),
	CONSTRAINT "email_expiry_check" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "email_lease_check" CHECK (("status" = 'processing' and "lease_token" is not null and "lease_expires_at" is not null)
    or ("status" <> 'processing' and "lease_token" is null and "lease_expires_at" is null)),
	CONSTRAINT "email_payload_check" CHECK (("status" in ('pending', 'processing') and "encrypted_payload" is not null)
    or ("status" in ('sent', 'failed', 'expired', 'cancelled') and "encrypted_payload" is null))
);
--> statement-breakpoint
CREATE TABLE "auth"."identity_connection" (
	"id" uuid PRIMARY KEY,
	"installation_id" smallint,
	"organization_id" uuid,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"revision" integer NOT NULL,
	"configuration" jsonb NOT NULL,
	"secrets_ciphertext" text NOT NULL,
	"activated_at" timestamp with time zone,
	"tested_revision" integer,
	"tested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_connection_provider_check" CHECK (("provider" = 'google' and "installation_id" is not null and "installation_id" = 1 and "organization_id" is null) or ("provider" in ('oidc','saml') and "installation_id" is null and "organization_id" is not null)),
	CONSTRAINT "identity_connection_status_check" CHECK ("status" in ('draft','tested','active','disabled') and "revision" > 0 and ("tested_revision" is null or "tested_revision" = "revision") and ("status" not in ('active','tested') or ("tested_revision" is not null and "tested_revision" = "revision" and "tested_at" is not null)))
);
--> statement-breakpoint
CREATE TABLE "auth"."identity_connection_domain" (
	"identity_connection_id" uuid,
	"domain_id" uuid,
	"organization_id" uuid NOT NULL,
	"connection_revision" integer NOT NULL,
	"domain_revision" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "identity_connection_domain_pkey" PRIMARY KEY("identity_connection_id","domain_id"),
	CONSTRAINT "connection_domain_revisions_check" CHECK ("connection_revision" > 0 and "domain_revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "instance"."installation" (
	"id" smallint PRIMARY KEY DEFAULT 1,
	"installation_id" uuid NOT NULL CONSTRAINT "installation_identity_unique" UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bootstrap_completed_at" timestamp with time zone,
	"bootstrap_token_hash" text,
	"bootstrap_token_issued_at" timestamp with time zone,
	"bootstrap_token_expires_at" timestamp with time zone,
	CONSTRAINT "installation_singleton_check" CHECK ("id" = 1),
	CONSTRAINT "installation_token_fields_check" CHECK (
    ("bootstrap_token_hash" is null and "bootstrap_token_issued_at" is null and "bootstrap_token_expires_at" is null)
    or ("bootstrap_token_hash" is not null and "bootstrap_token_hash" <> ''
      and "bootstrap_token_issued_at" is not null and "bootstrap_token_expires_at" is not null)),
	CONSTRAINT "installation_token_expiry_check" CHECK ("bootstrap_token_expires_at" > "bootstrap_token_issued_at"),
	CONSTRAINT "installation_completed_token_check" CHECK ("bootstrap_completed_at" is null or "bootstrap_token_hash" is null)
);
--> statement-breakpoint
CREATE TABLE "instance"."owner" (
	"id" uuid PRIMARY KEY,
	"installation_id" smallint DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"grant_source" text NOT NULL,
	"granted_by_user_id" uuid,
	"granted_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by_user_id" uuid,
	"revocation_reason" text,
	CONSTRAINT "owner_grant_source_check" CHECK ("grant_source" in ('bootstrap', 'owner', 'operator_recovery')),
	CONSTRAINT "owner_grant_actor_check" CHECK (("grant_source" = 'owner' and "granted_by_user_id" is not null)
    or ("grant_source" in ('bootstrap', 'operator_recovery') and "granted_by_user_id" is null)),
	CONSTRAINT "owner_revocation_time_check" CHECK ("revoked_at" >= "granted_at"),
	CONSTRAINT "owner_revocation_metadata_check" CHECK ("revoked_at" is not null
    or ("revoked_by_user_id" is null and "revocation_reason" is null)),
	CONSTRAINT "owner_revocation_reason_check" CHECK ("revocation_reason" is null or "revocation_reason" <> '')
);
--> statement-breakpoint
CREATE TABLE "instance"."settings" (
	"installation_id" smallint PRIMARY KEY DEFAULT 1,
	"display_name" text DEFAULT 'Preface' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_display_name_check" CHECK (char_length("display_name") between 1 and 120 and "display_name" = btrim("display_name")),
	CONSTRAINT "settings_revision_check" CHECK ("revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "organization"."invitation_assignment" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"scope_kind" text DEFAULT 'organization' NOT NULL,
	"team_id" uuid,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "invitation_assignment_scope_check" CHECK (("scope_kind" = 'organization' and "team_id" is null) or ("scope_kind" = 'team' and "team_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "organization"."organization" (
	"id" uuid PRIMARY KEY,
	"metadata" jsonb NOT NULL,
	"slug" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_metadata_check" CHECK (jsonb_typeof("metadata") = 'object' and "metadata" @> '{"version":1}'::jsonb and jsonb_typeof("metadata"->'name') = 'string' and coalesce(char_length("metadata"->>'name') between 1 and 120, false)),
	CONSTRAINT "organization_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length("slug") between 3 and 63)
);
--> statement-breakpoint
CREATE TABLE "organization"."auth_policy" (
	"organization_id" uuid PRIMARY KEY,
	"sso_mode" text DEFAULT 'optional' NOT NULL,
	"sso_max_age_seconds" integer DEFAULT 43200 NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"allowed_methods" jsonb NOT NULL,
	"updated_by_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_policy_sso_check" CHECK ("sso_mode" in ('optional', 'required') and "sso_max_age_seconds" between 300 and 604800),
	CONSTRAINT "auth_policy_revision_check" CHECK ("revision" > 0),
	CONSTRAINT "auth_policy_methods_check" CHECK (jsonb_typeof("allowed_methods") = 'array' and jsonb_array_length("allowed_methods") > 0 and "allowed_methods" <@ '["email_code","email_link","google","oidc","saml"]'::jsonb)
);
--> statement-breakpoint
CREATE TABLE "organization"."auth_policy_connection" (
	"organization_id" uuid,
	"identity_connection_id" uuid,
	"created_by_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_policy_connection_pkey" PRIMARY KEY("organization_id","identity_connection_id")
);
--> statement-breakpoint
CREATE TABLE "organization"."auth_recovery_token" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "auth_recovery_token_lifecycle_check" CHECK (not ("consumed_at" is not null and "revoked_at" is not null) and ("consumed_at" is null or "consumed_at" >= "created_at") and ("revoked_at" is null or "revoked_at" >= "created_at"))
);
--> statement-breakpoint
CREATE TABLE "organization"."domain" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"revision" integer NOT NULL,
	"verification_method" text,
	"challenge_hash" text,
	"challenge_expires_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verified_until" timestamp with time zone,
	"approved_by_user_id" uuid,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "domain_revision_check" CHECK ("revision" > 0),
	CONSTRAINT "domain_name_check" CHECK ("domain" = lower(btrim("domain"))),
	CONSTRAINT "domain_challenge_check" CHECK (("challenge_hash" is null) = ("challenge_expires_at" is null)),
	CONSTRAINT "domain_verification_check" CHECK (("verified_at" is null and "verified_until" is null and "verification_method" is null) or ("verified_at" is not null and "verified_until" > "verified_at" and "verification_method" in ('dns','operator'))),
	CONSTRAINT "domain_operator_check" CHECK (("verification_method" = 'operator' and "approved_by_user_id" is not null) or ("verification_method" is distinct from 'operator' and "approved_by_user_id" is null))
);
--> statement-breakpoint
CREATE TABLE "organization"."invitation" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"email" text NOT NULL,
	"invited_by_member_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"email_job_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by_user_id" uuid,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_email_check" CHECK ("email" = lower(btrim("email"))),
	CONSTRAINT "invitation_digest_check" CHECK ("token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "invitation_expiry_check" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "invitation_lifecycle_check" CHECK (("accepted_at" is null) = ("accepted_by_user_id" is null) and not ("accepted_at" is not null and "revoked_at" is not null) and ("accepted_at" is null or "accepted_at" >= "created_at") and ("revoked_at" is null or "revoked_at" >= "created_at"))
);
--> statement-breakpoint
CREATE TABLE "organization"."member" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"suspended_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_lifecycle_check" CHECK (("suspended_at" is null or "suspended_at" >= "joined_at") and ("removed_at" is null or "removed_at" >= "joined_at") and ("removed_at" is null or "suspended_at" is null))
);
--> statement-breakpoint
CREATE TABLE "organization"."role" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"scope_kind" text DEFAULT 'organization' NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"permissions" jsonb NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_kind_key_check" CHECK (("kind" = 'builtin' and "key" in ('owner', 'admin', 'member') and "archived_at" is null and ("key" <> 'owner' or "scope_kind" = 'organization')) or ("kind" = 'custom' and "key" not in ('owner', 'admin', 'member'))),
	CONSTRAINT "role_permissions_check" CHECK (jsonb_typeof("permissions") = 'array' and (("scope_kind" = 'organization' and "permissions" <@ '["organization.read","organization.update","organization.archive","members.read","members.manage","roles.read","roles.manage","roles.assign","teams.read","teams.manage"]'::jsonb) or ("scope_kind" = 'team' and "permissions" <@ '["team.read","team.update","team.archive","team.members.read","team.members.manage","team.roles.read","team.roles.assign"]'::jsonb)))
);
--> statement-breakpoint
CREATE TABLE "organization"."role_binding" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"scope_kind" text DEFAULT 'organization' NOT NULL,
	"team_id" uuid,
	"role_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"granted_by_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "role_binding_scope_check" CHECK (("scope_kind" = 'organization' and "team_id" is null) or ("scope_kind" = 'team' and "team_id" is not null)),
	CONSTRAINT "role_binding_revocation_check" CHECK ("revoked_at" >= "created_at")
);
--> statement-breakpoint
CREATE TABLE "auth"."session" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "session_token_hash_check" CHECK ("token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "session_expiry_check" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "session_activity_time_check" CHECK ("last_seen_at" >= "created_at"),
	CONSTRAINT "session_revocation_time_check" CHECK ("revoked_at" >= "created_at")
);
--> statement-breakpoint
CREATE TABLE "auth"."session_authentication" (
	"id" uuid PRIMARY KEY,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email_id" uuid,
	"account_id" uuid,
	"connection_revision" integer,
	"method" text NOT NULL,
	"provider_authenticated_at" timestamp with time zone,
	"authenticated_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"assurance" jsonb NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "session_authentication_method_check" CHECK (("method" in ('bootstrap_email_code', 'email_code', 'email_link') and "user_email_id" is not null and "account_id" is null and "connection_revision" is null) or ("method" in ('google','oidc','saml') and "user_email_id" is null and "account_id" is not null and "connection_revision" is not null and "connection_revision" > 0)),
	CONSTRAINT "session_authentication_provider_time_check" CHECK ("provider_authenticated_at" is null or "method" in ('oidc','saml')),
	CONSTRAINT "session_authentication_expiry_check" CHECK ("expires_at" > "authenticated_at"),
	CONSTRAINT "session_authentication_revocation_check" CHECK ("revoked_at" >= "authenticated_at"),
	CONSTRAINT "session_authentication_assurance_check" CHECK (("method" in ('google','oidc','saml') and "assurance" = jsonb_build_object('version',1,'provider',"method")) or ("method" in ('bootstrap_email_code','email_code','email_link') and "assurance" = '{"version":1,"emailVerified":true}'::jsonb))
);
--> statement-breakpoint
CREATE TABLE "auth"."sso_replay" (
	"identity_connection_id" uuid,
	"kind" text,
	"identifier_hash" text,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sso_replay_pkey" PRIMARY KEY("identity_connection_id","kind","identifier_hash"),
	CONSTRAINT "sso_replay_kind_check" CHECK ("kind" in ('response','assertion')),
	CONSTRAINT "sso_replay_expiry_check" CHECK ("expires_at" > "created_at")
);
--> statement-breakpoint
CREATE TABLE "organization"."team" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_metadata_check" CHECK (jsonb_typeof("metadata") = 'object' and "metadata" @> '{"version":1}'::jsonb and jsonb_typeof("metadata"->'name') = 'string' and coalesce(char_length("metadata"->>'name') between 1 and 120, false)),
	CONSTRAINT "team_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length("slug") between 3 and 63)
);
--> statement-breakpoint
CREATE TABLE "organization"."team_member" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"added_by_member_id" uuid NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."user" (
	"id" uuid PRIMARY KEY,
	"metadata" jsonb NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_metadata_check" CHECK (jsonb_typeof("metadata") = 'object' and "metadata" @> '{"version":1}'::jsonb and jsonb_typeof("metadata"->'name') = 'string' and coalesce(char_length("metadata"->>'name') between 1 and 120, false))
);
--> statement-breakpoint
CREATE TABLE "auth"."user_email" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"login_enabled" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_canonical_check" CHECK ("email" <> '' and "email" = lower(btrim("email"))),
	CONSTRAINT "user_email_removed_check" CHECK ("removed_at" is null or (not "is_primary" and not "login_enabled")),
	CONSTRAINT "user_email_login_verified_check" CHECK (not "login_enabled" or "verified_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "auth"."verification" (
	"id" uuid PRIMARY KEY,
	"purpose" text NOT NULL,
	"subject_key" text NOT NULL,
	"user_id" uuid,
	"user_email_id" uuid,
	"browser_binding_hash" text NOT NULL,
	"code_hash" text NOT NULL,
	"token_hash" text NOT NULL,
	"email_job_id" uuid,
	"context" jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "verification_purpose_check" CHECK ("purpose" in ('email_sign_in', 'invitation_email', 'email_reauthentication', 'external_identity_email')),
	CONSTRAINT "verification_attempts_check" CHECK ("attempts" between 0 and 5),
	CONSTRAINT "verification_expiry_check" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "verification_terminal_check" CHECK (not ("consumed_at" is not null and "revoked_at" is not null)),
	CONSTRAINT "verification_terminal_time_check" CHECK (("consumed_at" is null or "consumed_at" >= "created_at") and ("revoked_at" is null or "revoked_at" >= "created_at")),
	CONSTRAINT "verification_source_check" CHECK (("purpose" = 'email_sign_in' and (("user_id" is null and "user_email_id" is null and "email_job_id" is null) or ("user_id" is not null and "user_email_id" is not null and "email_job_id" is not null))) or ("purpose" = 'email_reauthentication' and "user_id" is not null and "user_email_id" is not null and "email_job_id" is not null) or ("purpose" in ('invitation_email', 'external_identity_email') and "user_id" is null and "user_email_id" is null and "email_job_id" is not null)),
	CONSTRAINT "verification_digest_check" CHECK ("subject_key" ~ '^[0-9a-f]{64}$' and "browser_binding_hash" ~ '^[0-9a-f]{64}$' and "code_hash" ~ '^[0-9a-f]{64}$' and "token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "verification_context_check" CHECK (("purpose" = 'email_sign_in' and "context" = '{"version":1}'::jsonb) or ("purpose" = 'email_reauthentication' and jsonb_typeof("context") = 'object' and "context"->>'version' = '1' and "context"->>'sessionId' ~ '^[0-9a-f-]{36}$') or ("purpose" = 'external_identity_email' and jsonb_typeof("context") = 'object' and "context"->>'version' = '1' and "context"->>'flowId' ~ '^[0-9a-f-]{36}$' and jsonb_typeof("context"->'email') = 'string') or ("purpose" = 'invitation_email' and jsonb_typeof("context") = 'object' and "context"->>'version' = '1' and "context"->>'invitationId' ~ '^[0-9a-f-]{36}$'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_identity_uidx" ON "auth"."account" ("identity_connection_id","issuer","subject");--> statement-breakpoint
CREATE UNIQUE INDEX "account_id_user_uidx" ON "auth"."account" ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_active_user_connection_uidx" ON "auth"."account" ("user_id","identity_connection_id") WHERE "unlinked_at" is null;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "auth"."account" ("user_id");--> statement-breakpoint
CREATE INDEX "event_organization_chronology_idx" ON "audit"."event" ("organization_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX "event_chronology_idx" ON "audit"."event" ("occurred_at","id");--> statement-breakpoint
CREATE INDEX "event_actor_chronology_idx" ON "audit"."event" ("actor_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "event_target_chronology_idx" ON "audit"."event" ("target_type","target_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_flow_saml_request_uidx" ON "auth"."auth_flow" ("saml_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_flow_state_uidx" ON "auth"."auth_flow" ("state_hash");--> statement-breakpoint
CREATE INDEX "auth_flow_connection_idx" ON "auth"."auth_flow" ("identity_connection_id");--> statement-breakpoint
CREATE INDEX "auth_flow_expiry_idx" ON "auth"."auth_flow" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bootstrap_challenge_installation_unique" ON "instance"."bootstrap_challenge" ("installation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idempotency_key_unique" ON "jobs"."email" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "email_pending_idx" ON "jobs"."email" ("available_at") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "email_lease_idx" ON "jobs"."email" ("lease_expires_at") WHERE "status" = 'processing';--> statement-breakpoint
CREATE UNIQUE INDEX "identity_connection_installation_provider_uidx" ON "auth"."identity_connection" ("installation_id","provider") WHERE "installation_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "identity_connection_id_organization_uidx" ON "auth"."identity_connection" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "identity_connection_id_provider_uidx" ON "auth"."identity_connection" ("id","provider");--> statement-breakpoint
CREATE INDEX "identity_connection_organization_idx" ON "auth"."identity_connection" ("organization_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "owner_active_user_uidx" ON "instance"."owner" ("user_id") WHERE "revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "owner_bootstrap_uidx" ON "instance"."owner" ("installation_id") WHERE "grant_source" = 'bootstrap';--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_assignment_role_uidx" ON "organization"."invitation_assignment" ("invitation_id","role_id") WHERE "team_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_assignment_team_role_uidx" ON "organization"."invitation_assignment" ("invitation_id","team_id","role_id") WHERE "team_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization"."organization" ("slug");--> statement-breakpoint
CREATE INDEX "organization_creator_idx" ON "organization"."organization" ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_recovery_token_active_member_uidx" ON "organization"."auth_recovery_token" ("organization_id","member_id") WHERE "consumed_at" is null and "revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "domain_organization_name_uidx" ON "organization"."domain" ("organization_id","domain");--> statement-breakpoint
CREATE UNIQUE INDEX "domain_id_organization_uidx" ON "organization"."domain" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_id_organization_uidx" ON "organization"."invitation" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_token_uidx" ON "organization"."invitation" ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_pending_recipient_uidx" ON "organization"."invitation" ("organization_id","email") WHERE "accepted_at" is null and "revoked_at" is null;--> statement-breakpoint
CREATE INDEX "invitation_organization_idx" ON "organization"."invitation" ("organization_id","id");--> statement-breakpoint
CREATE INDEX "invitation_expiry_idx" ON "organization"."invitation" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_user_uidx" ON "organization"."member" ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_id_organization_uidx" ON "organization"."member" ("id","organization_id");--> statement-breakpoint
CREATE INDEX "member_user_idx" ON "organization"."member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_organization_key_uidx" ON "organization"."role" ("organization_id","scope_kind","key");--> statement-breakpoint
CREATE UNIQUE INDEX "role_id_organization_uidx" ON "organization"."role" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_id_organization_scope_uidx" ON "organization"."role" ("id","organization_id","scope_kind");--> statement-breakpoint
CREATE UNIQUE INDEX "role_binding_active_team_uidx" ON "organization"."role_binding" ("organization_id","team_id","role_id","member_id") WHERE "revoked_at" is null and "team_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "role_binding_active_uidx" ON "organization"."role_binding" ("organization_id","role_id","member_id") WHERE "revoked_at" is null and "team_id" is null;--> statement-breakpoint
CREATE INDEX "role_binding_member_idx" ON "organization"."role_binding" ("organization_id","member_id");--> statement-breakpoint
CREATE INDEX "role_binding_role_idx" ON "organization"."role_binding" ("organization_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_id_user_unique" ON "auth"."session" ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_hash_uidx" ON "auth"."session" ("token_hash");--> statement-breakpoint
CREATE INDEX "session_user_created_idx" ON "auth"."session" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "session_expiry_idx" ON "auth"."session" ("expires_at");--> statement-breakpoint
CREATE INDEX "session_authentication_account_idx" ON "auth"."session_authentication" ("account_id");--> statement-breakpoint
CREATE INDEX "session_authentication_session_idx" ON "auth"."session_authentication" ("session_id");--> statement-breakpoint
CREATE INDEX "sso_replay_expiry_idx" ON "auth"."sso_replay" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_organization_slug_uidx" ON "organization"."team" ("organization_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "team_id_organization_uidx" ON "organization"."team" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_identity_uidx" ON "organization"."team_member" ("organization_id","team_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_active_email_uidx" ON "auth"."user_email" ("email") WHERE "removed_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_primary_uidx" ON "auth"."user_email" ("user_id") WHERE "removed_at" is null and "is_primary";--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_id_user_unique" ON "auth"."user_email" ("id","user_id");--> statement-breakpoint
CREATE INDEX "user_email_user_idx" ON "auth"."user_email" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_pending_subject_uidx" ON "auth"."verification" ("purpose","subject_key") WHERE "consumed_at" is null and "revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "verification_token_uidx" ON "auth"."verification" ("token_hash");--> statement-breakpoint
CREATE INDEX "verification_expiry_idx" ON "auth"."verification" ("expires_at");--> statement-breakpoint
ALTER TABLE "auth"."account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."account" ADD CONSTRAINT "account_identity_connection_id_identity_connection_id_fkey" FOREIGN KEY ("identity_connection_id") REFERENCES "auth"."identity_connection"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "audit"."event" ADD CONSTRAINT "event_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "audit"."event" ADD CONSTRAINT "event_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_identity_connection_id_identity_connection_id_fkey" FOREIGN KEY ("identity_connection_id") REFERENCES "auth"."identity_connection"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_expected_user_id_user_id_fkey" FOREIGN KEY ("expected_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_target_organization_id_organization_id_fkey" FOREIGN KEY ("target_organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_XK8F339MCMR7_fkey" FOREIGN KEY ("initiating_session_id","expected_user_id") REFERENCES "auth"."session"("id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_hbJFkjg6xGsL_fkey" FOREIGN KEY ("identity_connection_id","provider") REFERENCES "auth"."identity_connection"("id","provider") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_GPPtImLNqL3M_fkey" FOREIGN KEY ("identity_connection_id","connection_organization_id") REFERENCES "auth"."identity_connection"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_RYv32z20lZ0N_fkey" FOREIGN KEY ("invitation_id","target_organization_id") REFERENCES "organization"."invitation"("id","organization_id");--> statement-breakpoint
ALTER TABLE "instance"."bootstrap_challenge" ADD CONSTRAINT "bootstrap_challenge_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."bootstrap_challenge" ADD CONSTRAINT "bootstrap_challenge_email_job_id_email_id_fkey" FOREIGN KEY ("email_job_id") REFERENCES "jobs"."email"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" ADD CONSTRAINT "identity_connection_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" ADD CONSTRAINT "identity_connection_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."identity_connection_domain" ADD CONSTRAINT "identity_connection_domain_c5rZhgHLo0KC_fkey" FOREIGN KEY ("identity_connection_id","organization_id") REFERENCES "auth"."identity_connection"("id","organization_id");--> statement-breakpoint
ALTER TABLE "auth"."identity_connection_domain" ADD CONSTRAINT "identity_connection_domain_yTaS7nhxG4QU_fkey" FOREIGN KEY ("domain_id","organization_id") REFERENCES "organization"."domain"("id","organization_id");--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_granted_by_user_id_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_revoked_by_user_id_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."settings" ADD CONSTRAINT "settings_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation_assignment" ADD CONSTRAINT "invitation_assignment_invitation_organization_fk" FOREIGN KEY ("invitation_id","organization_id") REFERENCES "organization"."invitation"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation_assignment" ADD CONSTRAINT "invitation_assignment_role_organization_fk" FOREIGN KEY ("role_id","organization_id","scope_kind") REFERENCES "organization"."role"("id","organization_id","scope_kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation_assignment" ADD CONSTRAINT "invitation_assignment_team_fk" FOREIGN KEY ("team_id","organization_id") REFERENCES "organization"."team"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."organization" ADD CONSTRAINT "organization_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" ADD CONSTRAINT "auth_policy_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" ADD CONSTRAINT "auth_policy_updater_organization_fk" FOREIGN KEY ("updated_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy_connection" ADD CONSTRAINT "auth_policy_connection_Nwgv4zrOYb4y_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."auth_policy"("organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy_connection" ADD CONSTRAINT "auth_policy_connection_1mUI35pNqME2_fkey" FOREIGN KEY ("identity_connection_id","organization_id") REFERENCES "auth"."identity_connection"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy_connection" ADD CONSTRAINT "auth_policy_connection_lh9TRCLx7WMp_fkey" FOREIGN KEY ("created_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_recovery_token" ADD CONSTRAINT "auth_recovery_token_UqtVuFMbmcAk_fkey" FOREIGN KEY ("member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."domain" ADD CONSTRAINT "domain_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id");--> statement-breakpoint
ALTER TABLE "organization"."domain" ADD CONSTRAINT "domain_approved_by_user_id_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "auth"."user"("id");--> statement-breakpoint
ALTER TABLE "organization"."invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation" ADD CONSTRAINT "invitation_email_job_id_email_id_fkey" FOREIGN KEY ("email_job_id") REFERENCES "jobs"."email"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation" ADD CONSTRAINT "invitation_accepted_by_user_id_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation" ADD CONSTRAINT "invitation_inviter_organization_fk" FOREIGN KEY ("invited_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role" ADD CONSTRAINT "role_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role_binding" ADD CONSTRAINT "role_binding_role_organization_fk" FOREIGN KEY ("role_id","organization_id","scope_kind") REFERENCES "organization"."role"("id","organization_id","scope_kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role_binding" ADD CONSTRAINT "role_binding_member_organization_fk" FOREIGN KEY ("member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role_binding" ADD CONSTRAINT "role_binding_granter_organization_fk" FOREIGN KEY ("granted_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role_binding" ADD CONSTRAINT "role_binding_team_member_fk" FOREIGN KEY ("organization_id","team_id","member_id") REFERENCES "organization"."team_member"("organization_id","team_id","member_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD CONSTRAINT "session_authentication_8i7mLLgOt5nB_fkey" FOREIGN KEY ("session_id","user_id") REFERENCES "auth"."session"("id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD CONSTRAINT "session_authentication_ejFOkCg9tUm7_fkey" FOREIGN KEY ("user_email_id","user_id") REFERENCES "auth"."user_email"("id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD CONSTRAINT "session_authentication_ScmhX3g5yfsZ_fkey" FOREIGN KEY ("account_id","user_id") REFERENCES "auth"."account"("id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."sso_replay" ADD CONSTRAINT "sso_replay_identity_connection_id_identity_connection_id_fkey" FOREIGN KEY ("identity_connection_id") REFERENCES "auth"."identity_connection"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."team" ADD CONSTRAINT "team_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."team" ADD CONSTRAINT "team_creator_organization_fk" FOREIGN KEY ("created_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."team_member" ADD CONSTRAINT "team_member_team_organization_fk" FOREIGN KEY ("team_id","organization_id") REFERENCES "organization"."team"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."team_member" ADD CONSTRAINT "team_member_member_organization_fk" FOREIGN KEY ("member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."team_member" ADD CONSTRAINT "team_member_actor_organization_fk" FOREIGN KEY ("added_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."user_email" ADD CONSTRAINT "user_email_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."verification" ADD CONSTRAINT "verification_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."verification" ADD CONSTRAINT "verification_email_job_id_email_id_fkey" FOREIGN KEY ("email_job_id") REFERENCES "jobs"."email"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."verification" ADD CONSTRAINT "verification_user_email_id_user_id_user_email_id_user_id_fkey" FOREIGN KEY ("user_email_id","user_id") REFERENCES "auth"."user_email"("id","user_id") ON DELETE RESTRICT;