CREATE TABLE "auth"."identity_connection_key" (
	"id" uuid PRIMARY KEY,
	"identity_connection_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"connection_revision" integer NOT NULL,
	"certificate" text NOT NULL,
	"private_key_ciphertext" text,
	"status" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"tested_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"retired_at" timestamp with time zone,
	CONSTRAINT "connection_key_status_check" CHECK ("status" in ('pending','activated','retiring','retired')),
	CONSTRAINT "connection_key_revision_check" CHECK ("connection_revision" > 0),
	CONSTRAINT "connection_key_secret_check" CHECK (("status" = 'pending' and "private_key_ciphertext" is not null) or ("status" <> 'pending' and "private_key_ciphertext" is null)),
	CONSTRAINT "connection_key_retired_check" CHECK (("status" = 'retired') = ("retired_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD COLUMN "signing_key_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "connection_key_id_connection_uidx" ON "auth"."identity_connection_key" ("id","identity_connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "connection_key_pending_uidx" ON "auth"."identity_connection_key" ("identity_connection_id") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "connection_key_connection_idx" ON "auth"."identity_connection_key" ("identity_connection_id");--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_iX0oEiE17NXX_fkey" FOREIGN KEY ("signing_key_id","identity_connection_id") REFERENCES "auth"."identity_connection_key"("id","identity_connection_id");--> statement-breakpoint
ALTER TABLE "auth"."identity_connection_key" ADD CONSTRAINT "identity_connection_key_bQQCraoC5flt_fkey" FOREIGN KEY ("identity_connection_id","organization_id") REFERENCES "auth"."identity_connection"("id","organization_id");--> statement-breakpoint
ALTER TABLE "auth"."auth_flow" ADD CONSTRAINT "auth_flow_signing_key_check" CHECK ("signing_key_id" is null or ("provider" = 'saml' and "intent" = 'test'));