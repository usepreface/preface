CREATE SCHEMA "jobs";
--> statement-breakpoint
CREATE TABLE "jobs"."email" (
	"id" uuid PRIMARY KEY,
	"type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"payload_fingerprint" text NOT NULL,
	"encrypted_payload" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"lease_token" text,
	"lease_expires_at" timestamp with time zone,
	"last_error_code" text,
	"provider" text,
	"provider_message_id" text,
	"sent_at" timestamp with time zone,
	CONSTRAINT "email_status_check" CHECK ("status" in ('pending', 'processing', 'sent', 'failed', 'expired', 'cancelled')),
	CONSTRAINT "email_attempts_check" CHECK ("attempts" >= 0),
	CONSTRAINT "email_expiry_check" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "email_lease_check" CHECK (("status" = 'processing' and "lease_token" is not null and "lease_expires_at" is not null)
    or ("status" <> 'processing' and "lease_token" is null and "lease_expires_at" is null)),
	CONSTRAINT "email_payload_check" CHECK (("status" in ('pending', 'processing') and "encrypted_payload" is not null)
    or ("status" in ('sent', 'failed', 'expired', 'cancelled') and "encrypted_payload" is null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "email_idempotency_key_unique" ON "jobs"."email" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "email_pending_idx" ON "jobs"."email" ("available_at") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "email_lease_idx" ON "jobs"."email" ("lease_expires_at") WHERE "status" = 'processing';