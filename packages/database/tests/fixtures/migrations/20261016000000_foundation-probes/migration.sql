CREATE TABLE instance.foundation_probe (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT foundation_probe_name_unique UNIQUE (name)
);
--> statement-breakpoint
CREATE TABLE auth.foundation_probe (
  id uuid PRIMARY KEY,
  instance_probe_id uuid NOT NULL REFERENCES instance.foundation_probe(id) ON DELETE RESTRICT
);
