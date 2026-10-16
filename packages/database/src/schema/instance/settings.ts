import { sql } from "drizzle-orm";
import { check, integer, smallint, text } from "drizzle-orm/pg-core";

import { installation } from "#/schema/instance/installation";
import { instanceSchema } from "#/schema/instance/schema";
import { timestampColumns } from "#/schema/timestamps";

export const instanceSettings = instanceSchema.table(
  "settings",
  {
    installationId: smallint("installation_id")
      .$type<1>()
      .primaryKey()
      .default(1)
      .references(() => installation.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull().default("Preface"),
    revision: integer("revision").notNull().default(1),
    ...timestampColumns(),
  },
  (table) => [
    check(
      "settings_display_name_check",
      sql`char_length(${table.displayName}) between 1 and 120 and ${table.displayName} = btrim(${table.displayName})`,
    ),
    check("settings_revision_check", sql`${table.revision} > 0`),
  ],
);
