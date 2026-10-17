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
ALTER TABLE "auth"."auth_flow" ADD COLUMN "saml_request_id" text;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD COLUMN "saml_verified_ciphertext" text;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ALTER COLUMN "nonce_hash" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_flow_saml_request_uidx" ON "auth"."auth_flow" ("saml_request_id");--> statement-breakpoint
CREATE INDEX "sso_replay_expiry_idx" ON "auth"."sso_replay" ("expires_at");--> statement-breakpoint
ALTER TABLE "auth"."sso_replay" ADD CONSTRAINT "sso_replay_identity_connection_id_identity_connection_id_fkey" FOREIGN KEY ("identity_connection_id") REFERENCES "auth"."identity_connection"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_protocol_check" CHECK (("provider" = 'saml' and "saml_request_id" is not null and "nonce_hash" is null and "pkce_verifier_ciphertext" is null) or ("provider" in ('google','oidc') and "saml_request_id" is null and "saml_verified_ciphertext" is null and "nonce_hash" is not null));--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_saml_verified_check" CHECK ("saml_verified_ciphertext" is null or ("claimed_at" is not null and "consumed_at" is null and "revoked_at" is null));--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" DROP CONSTRAINT "auth_flow_owner_check", ADD CONSTRAINT "auth_flow_owner_check" CHECK (("provider" = 'google' and "target_organization_id" is null) or ("provider" in ('oidc','saml') and "target_organization_id" is not null));--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" DROP CONSTRAINT "identity_connection_provider_check", ADD CONSTRAINT "identity_connection_provider_check" CHECK (("provider" = 'google' and "installation_id" is not null and "installation_id" = 1 and "organization_id" is null) or ("provider" in ('oidc','saml') and "installation_id" is null and "organization_id" is not null));--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" DROP CONSTRAINT "auth_policy_methods_check", ADD CONSTRAINT "auth_policy_methods_check" CHECK (jsonb_typeof("allowed_methods") = 'array' and jsonb_array_length("allowed_methods") > 0 and "allowed_methods" <@ '["email_code","email_link","google","oidc","saml"]'::jsonb);--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" DROP CONSTRAINT "session_authentication_method_check", ADD CONSTRAINT "session_authentication_method_check" CHECK (("method" in ('bootstrap_email_code', 'email_code', 'email_link') and "user_email_id" is not null and "account_id" is null and "connection_revision" is null) or ("method" in ('google','oidc','saml') and "user_email_id" is null and "account_id" is not null and "connection_revision" is not null and "connection_revision" > 0));--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" DROP CONSTRAINT "session_authentication_provider_time_check", ADD CONSTRAINT "session_authentication_provider_time_check" CHECK ("provider_authenticated_at" is null or "method" in ('oidc','saml'));--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" DROP CONSTRAINT "session_authentication_assurance_check", ADD CONSTRAINT "session_authentication_assurance_check" CHECK (("method" in ('google','oidc','saml') and "assurance" = jsonb_build_object('version',1,'provider',"method")) or ("method" in ('bootstrap_email_code','email_code','email_link') and "assurance" = '{"version":1,"emailVerified":true}'::jsonb));