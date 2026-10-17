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
	CONSTRAINT "account_google_issuer_check" CHECK ("issuer" = 'https://accounts.google.com' and char_length("subject") between 1 and 255)
);
--> statement-breakpoint
CREATE TABLE "auth"."auth_flow" (
	"id" uuid PRIMARY KEY,
	"identity_connection_id" uuid NOT NULL,
	"connection_revision" integer NOT NULL,
	"intent" text NOT NULL,
	"initiating_session_id" uuid,
	"expected_user_id" uuid,
	"target_organization_id" uuid,
	"state_hash" text NOT NULL,
	"browser_binding_hash" text NOT NULL,
	"nonce_hash" text NOT NULL,
	"pkce_verifier_ciphertext" text,
	"return_path" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "auth_flow_intent_check" CHECK (("intent" = 'sign_in' and "initiating_session_id" is null and "expected_user_id" is null) or ("intent" in ('link','reauthenticate','test') and "initiating_session_id" is not null and "expected_user_id" is not null)),
	CONSTRAINT "auth_flow_lifecycle_check" CHECK ("connection_revision" > 0 and "expires_at" > "created_at" and not ("consumed_at" is not null and "revoked_at" is not null) and ("consumed_at" is null or "claimed_at" is not null) and (("consumed_at" is null and "revoked_at" is null) or "pkce_verifier_ciphertext" is null)),
	CONSTRAINT "auth_flow_return_path_check" CHECK ("return_path" = '/api/docs')
);
--> statement-breakpoint
CREATE TABLE "auth"."identity_connection" (
	"id" uuid PRIMARY KEY,
	"installation_id" smallint NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"revision" integer NOT NULL,
	"configuration" jsonb NOT NULL,
	"secrets_ciphertext" text NOT NULL,
	"tested_revision" integer,
	"tested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_connection_provider_check" CHECK ("provider" = 'google'),
	CONSTRAINT "identity_connection_status_check" CHECK ("status" in ('draft','tested','active','disabled') and "revision" > 0 and ("tested_revision" is null or "tested_revision" = "revision") and ("status" not in ('active','tested') or ("tested_revision" is not null and "tested_revision" = "revision" and "tested_at" is not null)))
);
--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD COLUMN "connection_revision" integer;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ALTER COLUMN "user_email_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_identity_uidx" ON "auth"."account" ("identity_connection_id","issuer","subject");--> statement-breakpoint
CREATE UNIQUE INDEX "account_id_user_uidx" ON "auth"."account" ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_active_user_connection_uidx" ON "auth"."account" ("user_id","identity_connection_id") WHERE "unlinked_at" is null;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "auth"."account" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_flow_state_uidx" ON "auth"."auth_flow" ("state_hash");--> statement-breakpoint
CREATE INDEX "auth_flow_connection_idx" ON "auth"."auth_flow" ("identity_connection_id");--> statement-breakpoint
CREATE INDEX "auth_flow_expiry_idx" ON "auth"."auth_flow" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "identity_connection_installation_provider_uidx" ON "auth"."identity_connection" ("installation_id","provider");--> statement-breakpoint
CREATE INDEX "session_authentication_account_idx" ON "auth"."session_authentication" ("account_id");--> statement-breakpoint
ALTER TABLE "auth"."account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."account" ADD CONSTRAINT "account_identity_connection_id_identity_connection_id_fkey" FOREIGN KEY ("identity_connection_id") REFERENCES "auth"."identity_connection"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_identity_connection_id_identity_connection_id_fkey" FOREIGN KEY ("identity_connection_id") REFERENCES "auth"."identity_connection"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_expected_user_id_user_id_fkey" FOREIGN KEY ("expected_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_target_organization_id_organization_id_fkey" FOREIGN KEY ("target_organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_XK8F339MCMR7_fkey" FOREIGN KEY ("initiating_session_id","expected_user_id") REFERENCES "auth"."session"("id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."identity_connection" ADD CONSTRAINT "identity_connection_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" ADD CONSTRAINT "session_authentication_ScmhX3g5yfsZ_fkey" FOREIGN KEY ("account_id","user_id") REFERENCES "auth"."account"("id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" DROP CONSTRAINT "auth_policy_methods_check", ADD CONSTRAINT "auth_policy_methods_check" CHECK (jsonb_typeof("allowed_methods") = 'array' and jsonb_array_length("allowed_methods") > 0 and "allowed_methods" <@ '["email_code","email_link","google"]'::jsonb);--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" DROP CONSTRAINT "session_authentication_method_check", ADD CONSTRAINT "session_authentication_method_check" CHECK (("method" in ('bootstrap_email_code', 'email_code', 'email_link') and "user_email_id" is not null and "account_id" is null and "connection_revision" is null) or ("method" = 'google' and "user_email_id" is null and "account_id" is not null and "connection_revision" is not null and "connection_revision" > 0));--> statement-breakpoint
ALTER TABLE "auth"."session_authentication" DROP CONSTRAINT "session_authentication_assurance_check", ADD CONSTRAINT "session_authentication_assurance_check" CHECK (("method" = 'google' and "assurance" = '{"version":1,"provider":"google"}'::jsonb) or ("method" <> 'google' and "assurance" = '{"version":1,"emailVerified":true}'::jsonb));--> statement-breakpoint
ALTER TABLE "auth"."verification" DROP CONSTRAINT "verification_purpose_check", ADD CONSTRAINT "verification_purpose_check" CHECK ("purpose" in ('email_sign_in', 'invitation_email', 'email_reauthentication'));--> statement-breakpoint
ALTER TABLE "auth"."verification" DROP CONSTRAINT "verification_source_check", ADD CONSTRAINT "verification_source_check" CHECK (("purpose" = 'email_sign_in' and (("user_id" is null and "user_email_id" is null and "email_job_id" is null) or ("user_id" is not null and "user_email_id" is not null and "email_job_id" is not null))) or ("purpose" = 'email_reauthentication' and "user_id" is not null and "user_email_id" is not null and "email_job_id" is not null) or ("purpose" = 'invitation_email' and "user_id" is null and "user_email_id" is null and "email_job_id" is not null));--> statement-breakpoint
ALTER TABLE "auth"."verification" DROP CONSTRAINT "verification_context_check", ADD CONSTRAINT "verification_context_check" CHECK (("purpose" = 'email_sign_in' and "context" = '{"version":1}'::jsonb) or ("purpose" = 'email_reauthentication' and jsonb_typeof("context") = 'object' and "context"->>'version' = '1' and "context"->>'sessionId' ~ '^[0-9a-f-]{36}$') or ("purpose" = 'invitation_email' and jsonb_typeof("context") = 'object' and "context"->>'version' = '1' and "context"->>'invitationId' ~ '^[0-9a-f-]{36}$'));