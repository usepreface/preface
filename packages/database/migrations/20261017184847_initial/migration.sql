CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "instance";
--> statement-breakpoint
CREATE SCHEMA "jobs";
--> statement-breakpoint
CREATE TABLE "audit"."event" (
	"id" uuid PRIMARY KEY,
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
	"user_email_id" uuid NOT NULL,
	"method" text NOT NULL,
	"authenticated_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"assurance" jsonb NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "session_authentication_method_check" CHECK ("method" in ('bootstrap_email_code', 'email_code', 'email_link')),
	CONSTRAINT "session_authentication_expiry_check" CHECK ("expires_at" > "authenticated_at"),
	CONSTRAINT "session_authentication_revocation_check" CHECK ("revoked_at" >= "authenticated_at"),
	CONSTRAINT "session_authentication_assurance_check" CHECK ("assurance" = '{"version":1,"emailVerified":true}'::jsonb)
);
--> statement-breakpoint
CREATE TABLE "auth"."user" (
	"id" uuid PRIMARY KEY,
	"display_name" text NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_display_name_check" CHECK ("display_name" = btrim("display_name") and char_length("display_name") between 1 and 120)
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
	CONSTRAINT "verification_purpose_check" CHECK ("purpose" = 'email_sign_in'),
	CONSTRAINT "verification_attempts_check" CHECK ("attempts" between 0 and 5),
	CONSTRAINT "verification_expiry_check" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "verification_terminal_check" CHECK (not ("consumed_at" is not null and "revoked_at" is not null)),
	CONSTRAINT "verification_terminal_time_check" CHECK (("consumed_at" is null or "consumed_at" >= "created_at") and ("revoked_at" is null or "revoked_at" >= "created_at")),
	CONSTRAINT "verification_source_check" CHECK (("user_id" is null and "user_email_id" is null and "email_job_id" is null) or ("user_id" is not null and "user_email_id" is not null and "email_job_id" is not null)),
	CONSTRAINT "verification_digest_check" CHECK ("subject_key" ~ '^[0-9a-f]{64}$' and "browser_binding_hash" ~ '^[0-9a-f]{64}$' and "code_hash" ~ '^[0-9a-f]{64}$' and "token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "verification_context_check" CHECK ("context" = '{"version":1}'::jsonb)
);
--> statement-breakpoint
CREATE INDEX "event_chronology_idx" ON "audit"."event" ("occurred_at","id");--> statement-breakpoint
CREATE INDEX "event_actor_chronology_idx" ON "audit"."event" ("actor_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "event_target_chronology_idx" ON "audit"."event" ("target_type","target_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bootstrap_challenge_installation_unique" ON "instance"."bootstrap_challenge" ("installation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idempotency_key_unique" ON "jobs"."email" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "email_pending_idx" ON "jobs"."email" ("available_at") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "email_lease_idx" ON "jobs"."email" ("lease_expires_at") WHERE "status" = 'processing';--> statement-breakpoint
CREATE UNIQUE INDEX "owner_active_user_uidx" ON "instance"."owner" ("user_id") WHERE "revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "owner_bootstrap_uidx" ON "instance"."owner" ("installation_id") WHERE "grant_source" = 'bootstrap';--> statement-breakpoint
CREATE UNIQUE INDEX "session_id_user_unique" ON "auth"."session" ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_hash_uidx" ON "auth"."session" ("token_hash");--> statement-breakpoint
CREATE INDEX "session_user_created_idx" ON "auth"."session" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "session_expiry_idx" ON "auth"."session" ("expires_at");--> statement-breakpoint
CREATE INDEX "session_authentication_session_idx" ON "auth"."session_authentication" ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_active_email_uidx" ON "auth"."user_email" ("email") WHERE "removed_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_primary_uidx" ON "auth"."user_email" ("user_id") WHERE "removed_at" is null and "is_primary";--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_id_user_unique" ON "auth"."user_email" ("id","user_id");--> statement-breakpoint
CREATE INDEX "user_email_user_idx" ON "auth"."user_email" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_pending_subject_uidx" ON "auth"."verification" ("purpose","subject_key") WHERE "consumed_at" is null and "revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "verification_token_uidx" ON "auth"."verification" ("token_hash");--> statement-breakpoint
CREATE INDEX "verification_expiry_idx" ON "auth"."verification" ("expires_at");--> statement-breakpoint
ALTER TABLE "audit"."event" ADD CONSTRAINT "event_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."bootstrap_challenge" ADD CONSTRAINT "bootstrap_challenge_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."bootstrap_challenge" ADD CONSTRAINT "bootstrap_challenge_email_job_id_email_id_fkey" FOREIGN KEY ("email_job_id") REFERENCES "jobs"."email"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_granted_by_user_id_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_revoked_by_user_id_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."settings" ADD CONSTRAINT "settings_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD CONSTRAINT "session_authentication_8i7mLLgOt5nB_fkey" FOREIGN KEY ("session_id","user_id") REFERENCES "auth"."session"("id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD CONSTRAINT "session_authentication_ejFOkCg9tUm7_fkey" FOREIGN KEY ("user_email_id","user_id") REFERENCES "auth"."user_email"("id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."user_email" ADD CONSTRAINT "user_email_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."verification" ADD CONSTRAINT "verification_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."verification" ADD CONSTRAINT "verification_email_job_id_email_id_fkey" FOREIGN KEY ("email_job_id") REFERENCES "jobs"."email"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."verification" ADD CONSTRAINT "verification_user_email_id_user_id_user_email_id_user_id_fkey" FOREIGN KEY ("user_email_id","user_id") REFERENCES "auth"."user_email"("id","user_id") ON DELETE RESTRICT;