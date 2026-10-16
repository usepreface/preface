CREATE TABLE instance.failed_migration_probe (id uuid PRIMARY KEY);
--> statement-breakpoint
SELECT * FROM missing_foundation_migration_table;
