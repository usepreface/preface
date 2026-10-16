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
CREATE UNIQUE INDEX "owner_active_user_uidx" ON "instance"."owner" ("user_id") WHERE "revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "owner_bootstrap_uidx" ON "instance"."owner" ("installation_id") WHERE "grant_source" = 'bootstrap';--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."settings" ADD CONSTRAINT "settings_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;