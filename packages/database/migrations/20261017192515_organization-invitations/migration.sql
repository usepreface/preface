CREATE TABLE "organization"."invitation_assignment" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization"."invitation" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
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
CREATE UNIQUE INDEX "invitation_assignment_role_uidx" ON "organization"."invitation_assignment" ("invitation_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_id_organization_uidx" ON "organization"."invitation" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_token_uidx" ON "organization"."invitation" ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_pending_recipient_uidx" ON "organization"."invitation" ("organization_id","email") WHERE "accepted_at" is null and "revoked_at" is null;--> statement-breakpoint
CREATE INDEX "invitation_organization_idx" ON "organization"."invitation" ("organization_id","id");--> statement-breakpoint
CREATE INDEX "invitation_expiry_idx" ON "organization"."invitation" ("expires_at");--> statement-breakpoint
ALTER TABLE "organization"."invitation_assignment" ADD CONSTRAINT "invitation_assignment_invitation_organization_fk" FOREIGN KEY ("invitation_id","organization_id") REFERENCES "organization"."invitation"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation_assignment" ADD CONSTRAINT "invitation_assignment_role_organization_fk" FOREIGN KEY ("role_id","organization_id") REFERENCES "organization"."role"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation" ADD CONSTRAINT "invitation_email_job_id_email_id_fkey" FOREIGN KEY ("email_job_id") REFERENCES "jobs"."email"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation" ADD CONSTRAINT "invitation_accepted_by_user_id_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."invitation" ADD CONSTRAINT "invitation_inviter_organization_fk" FOREIGN KEY ("invited_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."verification" DROP CONSTRAINT "verification_purpose_check", ADD CONSTRAINT "verification_purpose_check" CHECK ("purpose" in ('email_sign_in', 'invitation_email'));--> statement-breakpoint
ALTER TABLE "auth"."verification" DROP CONSTRAINT "verification_source_check", ADD CONSTRAINT "verification_source_check" CHECK (("purpose" = 'email_sign_in' and (("user_id" is null and "user_email_id" is null and "email_job_id" is null) or ("user_id" is not null and "user_email_id" is not null and "email_job_id" is not null))) or ("purpose" = 'invitation_email' and "user_id" is null and "user_email_id" is null and "email_job_id" is not null));--> statement-breakpoint
ALTER TABLE "auth"."verification" DROP CONSTRAINT "verification_context_check", ADD CONSTRAINT "verification_context_check" CHECK (("purpose" = 'email_sign_in' and "context" = '{"version":1}'::jsonb) or ("purpose" = 'invitation_email' and jsonb_typeof("context") = 'object' and "context"->>'version' = '1' and "context"->>'invitationId' ~ '^[0-9a-f-]{36}$'));