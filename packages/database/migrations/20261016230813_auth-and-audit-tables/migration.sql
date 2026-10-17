CREATE SCHEMA "audit";
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
CREATE TABLE "auth"."password_credential" (
	"user_id" uuid PRIMARY KEY,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"password_changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "password_credential_hash_check" CHECK ("password_hash" <> ''),
	CONSTRAINT "password_credential_change_time_check" CHECK ("password_changed_at" >= "created_at")
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
CREATE TABLE "auth"."user" (
	"id" uuid PRIMARY KEY,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_display_name_check" CHECK ("display_name" = btrim("display_name") and char_length("display_name") between 1 and 120),
	CONSTRAINT "user_email_canonical_check" CHECK ("email" <> '' and "email" = lower(btrim("email")))
);
--> statement-breakpoint
CREATE INDEX "event_chronology_idx" ON "audit"."event" ("occurred_at","id");--> statement-breakpoint
CREATE INDEX "event_actor_chronology_idx" ON "audit"."event" ("actor_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "event_target_chronology_idx" ON "audit"."event" ("target_type","target_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_hash_uidx" ON "auth"."session" ("token_hash");--> statement-breakpoint
CREATE INDEX "session_user_created_idx" ON "auth"."session" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "session_expiry_idx" ON "auth"."session" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_uidx" ON "auth"."user" ("email");--> statement-breakpoint
ALTER TABLE "audit"."event" ADD CONSTRAINT "event_actor_user_id_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_granted_by_user_id_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."owner" ADD CONSTRAINT "owner_revoked_by_user_id_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."password_credential" ADD CONSTRAINT "password_credential_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;