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
ALTER TABLE "auth"."auth_flow" ADD COLUMN "requested_max_age_seconds" integer;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" ADD COLUMN "sso_mode" text DEFAULT 'optional' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" ADD COLUMN "sso_max_age_seconds" integer DEFAULT 43200 NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD COLUMN "provider_authenticated_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_recovery_token_active_member_uidx" ON "organization"."auth_recovery_token" ("organization_id","member_id") WHERE "consumed_at" is null and "revoked_at" is null;--> statement-breakpoint
ALTER TABLE "organization"."auth_recovery_token" ADD CONSTRAINT "auth_recovery_token_UqtVuFMbmcAk_fkey" FOREIGN KEY ("member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_max_age_check" CHECK ("requested_max_age_seconds" >= 0);--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" ADD CONSTRAINT "auth_policy_sso_check" CHECK ("sso_mode" in ('optional', 'required') and "sso_max_age_seconds" between 300 and 604800);--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD CONSTRAINT "session_authentication_provider_time_check" CHECK ("provider_authenticated_at" is null or "method" = 'oidc');