CREATE TABLE "organization"."auth_policy_connection" (
	"organization_id" uuid,
	"identity_connection_id" uuid,
	"created_by_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_policy_connection_pkey" PRIMARY KEY("organization_id","identity_connection_id")
);
--> statement-breakpoint
ALTER TABLE "auth"."account" RENAME CONSTRAINT "account_google_issuer_check" TO "account_identity_check";--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD COLUMN "provider" text DEFAULT 'google' NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" ADD COLUMN "activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" ALTER COLUMN "installation_id" DROP NOT NULL;--> statement-breakpoint
DROP INDEX "auth"."identity_connection_installation_provider_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX "identity_connection_installation_provider_uidx" ON "auth"."identity_connection" ("installation_id","provider") WHERE "installation_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "identity_connection_id_organization_uidx" ON "auth"."identity_connection" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "identity_connection_id_provider_uidx" ON "auth"."identity_connection" ("id","provider");--> statement-breakpoint
CREATE INDEX "identity_connection_organization_idx" ON "auth"."identity_connection" ("organization_id","id");--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_hbJFkjg6xGsL_fkey" FOREIGN KEY ("identity_connection_id","provider") REFERENCES "auth"."identity_connection"("id","provider") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_31dXdzqk2BiZ_fkey" FOREIGN KEY ("identity_connection_id","target_organization_id") REFERENCES "auth"."identity_connection"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" ADD CONSTRAINT "identity_connection_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy_connection" ADD CONSTRAINT "auth_policy_connection_Nwgv4zrOYb4y_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."auth_policy"("organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy_connection" ADD CONSTRAINT "auth_policy_connection_1mUI35pNqME2_fkey" FOREIGN KEY ("identity_connection_id","organization_id") REFERENCES "auth"."identity_connection"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy_connection" ADD CONSTRAINT "auth_policy_connection_lh9TRCLx7WMp_fkey" FOREIGN KEY ("created_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_owner_check" CHECK (("provider" = 'google' and "target_organization_id" is null) or ("provider" = 'oidc' and "target_organization_id" is not null));--> statement-breakpoint
ALTER TABLE "auth"."account" DROP CONSTRAINT "account_identity_check", ADD CONSTRAINT "account_identity_check" CHECK (char_length("issuer") between 1 and 2048 and char_length("subject") between 1 and 255);--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" DROP CONSTRAINT "identity_connection_provider_check", ADD CONSTRAINT "identity_connection_provider_check" CHECK (("provider" = 'google' and "installation_id" is not null and "installation_id" = 1 and "organization_id" is null) or ("provider" = 'oidc' and "installation_id" is null and "organization_id" is not null));--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" DROP CONSTRAINT "auth_policy_methods_check", ADD CONSTRAINT "auth_policy_methods_check" CHECK (jsonb_typeof("allowed_methods") = 'array' and jsonb_array_length("allowed_methods") > 0 and "allowed_methods" <@ '["email_code","email_link","google","oidc"]'::jsonb);--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" DROP CONSTRAINT "session_authentication_method_check", ADD CONSTRAINT "session_authentication_method_check" CHECK (("method" in ('bootstrap_email_code', 'email_code', 'email_link') and "user_email_id" is not null and "account_id" is null and "connection_revision" is null) or ("method" in ('google','oidc') and "user_email_id" is null and "account_id" is not null and "connection_revision" is not null and "connection_revision" > 0));--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" DROP CONSTRAINT "session_authentication_assurance_check", ADD CONSTRAINT "session_authentication_assurance_check" CHECK (("method" in ('google','oidc') and "assurance" = jsonb_build_object('version',1,'provider',"method")) or ("method" in ('bootstrap_email_code','email_code','email_link') and "assurance" = '{"version":1,"emailVerified":true}'::jsonb));