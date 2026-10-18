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
CREATE UNIQUE INDEX "domain_organization_name_uidx" ON "organization"."domain" ("organization_id","domain");--> statement-breakpoint
CREATE UNIQUE INDEX "domain_id_organization_uidx" ON "organization"."domain" ("id","organization_id");--> statement-breakpoint
ALTER TABLE "auth"."identity_connection_domain" ADD CONSTRAINT "identity_connection_domain_c5rZhgHLo0KC_fkey" FOREIGN KEY ("identity_connection_id","organization_id") REFERENCES "auth"."identity_connection"("id","organization_id");--> statement-breakpoint
ALTER TABLE "auth"."identity_connection_domain" ADD CONSTRAINT "identity_connection_domain_yTaS7nhxG4QU_fkey" FOREIGN KEY ("domain_id","organization_id") REFERENCES "organization"."domain"("id","organization_id");--> statement-breakpoint
ALTER TABLE "organization"."domain" ADD CONSTRAINT "domain_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"."organization"("id");--> statement-breakpoint
ALTER TABLE "organization"."domain" ADD CONSTRAINT "domain_approved_by_user_id_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "auth"."user"("id");