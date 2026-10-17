CREATE TABLE "instance"."bootstrap_challenge" (
	"id" uuid PRIMARY KEY,
	"installation_id" smallint DEFAULT 1 NOT NULL,
	"bootstrap_token_hash" text NOT NULL,
	"instance_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"email_job_id" uuid NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "bootstrap_challenge_attempts_check" CHECK ("attempts" between 0 and 5),
	CONSTRAINT "bootstrap_challenge_expiry_check" CHECK ("expires_at" > "created_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bootstrap_challenge_installation_unique" ON "instance"."bootstrap_challenge" ("installation_id");--> statement-breakpoint
ALTER TABLE "instance"."bootstrap_challenge" ADD CONSTRAINT "bootstrap_challenge_installation_id_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "instance"."installation"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "instance"."bootstrap_challenge" ADD CONSTRAINT "bootstrap_challenge_email_job_id_email_id_fkey" FOREIGN KEY ("email_job_id") REFERENCES "jobs"."email"("id") ON DELETE RESTRICT;