CREATE SCHEMA "organization";
--> statement-breakpoint
CREATE TABLE "organization"."organization" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length("slug") between 3 and 63)
);
--> statement-breakpoint
CREATE TABLE "organization"."auth_policy" (
	"organization_id" uuid PRIMARY KEY,
	"revision" integer DEFAULT 1 NOT NULL,
	"allowed_methods" jsonb NOT NULL,
	"updated_by_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_policy_revision_check" CHECK ("revision" > 0),
	CONSTRAINT "auth_policy_methods_check" CHECK (jsonb_typeof("allowed_methods") = 'array' and jsonb_array_length("allowed_methods") > 0 and "allowed_methods" <@ '["email_code","email_link"]'::jsonb)
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
	"key" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"permissions" jsonb NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_kind_key_check" CHECK (("kind" = 'builtin' and "key" in ('owner', 'admin', 'member') and "archived_at" is null) or ("kind" = 'custom' and "key" not in ('owner', 'admin', 'member'))),
	CONSTRAINT "role_permissions_check" CHECK (jsonb_typeof("permissions") = 'array' and "permissions" <@ '["organization.read","organization.update","organization.archive","members.read","members.manage","roles.read","roles.manage","roles.assign"]'::jsonb)
);
--> statement-breakpoint
CREATE TABLE "organization"."role_binding" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"granted_by_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "role_binding_revocation_check" CHECK ("revoked_at" >= "created_at")
);
--> statement-breakpoint
ALTER TABLE "audit"."event" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
CREATE INDEX "event_organization_chronology_idx" ON "audit"."event" ("organization_id","occurred_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization"."organization" ("slug");--> statement-breakpoint
CREATE INDEX "organization_creator_idx" ON "organization"."organization" ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_user_uidx" ON "organization"."member" ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_id_organization_uidx" ON "organization"."member" ("id","organization_id");--> statement-breakpoint
CREATE INDEX "member_user_idx" ON "organization"."member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_organization_key_uidx" ON "organization"."role" ("organization_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "role_id_organization_uidx" ON "organization"."role" ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_binding_active_uidx" ON "organization"."role_binding" ("organization_id","role_id","member_id") WHERE "revoked_at" is null;--> statement-breakpoint
CREATE INDEX "role_binding_member_idx" ON "organization"."role_binding" ("organization_id","member_id");--> statement-breakpoint
CREATE INDEX "role_binding_role_idx" ON "organization"."role_binding" ("organization_id","role_id");--> statement-breakpoint
ALTER TABLE "audit"."event" ADD CONSTRAINT "event_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."organization" ADD CONSTRAINT "organization_created_by_user_id_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" ADD CONSTRAINT "auth_policy_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."auth_policy" ADD CONSTRAINT "auth_policy_updater_organization_fk" FOREIGN KEY ("updated_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role" ADD CONSTRAINT "role_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role_binding" ADD CONSTRAINT "role_binding_role_organization_fk" FOREIGN KEY ("role_id","organization_id") REFERENCES "organization"."role"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role_binding" ADD CONSTRAINT "role_binding_member_organization_fk" FOREIGN KEY ("member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organization"."role_binding" ADD CONSTRAINT "role_binding_granter_organization_fk" FOREIGN KEY ("granted_by_member_id","organization_id") REFERENCES "organization"."member"("id","organization_id") ON DELETE RESTRICT;