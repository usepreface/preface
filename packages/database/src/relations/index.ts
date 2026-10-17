import { defineRelationsPart } from "drizzle-orm";

import { auditRelations } from "#/relations/audit";
import { authRelations } from "#/relations/auth";
import { instanceRelations } from "#/relations/instance";
import { organizationRelations } from "#/relations/organization";
import * as schema from "#/schema/index";

// The schema-wide part must come first to retain tables without explicit relations.
const schemaRelations = defineRelationsPart(schema);
export const relations = {
  ...schemaRelations,
  ...authRelations,
  ...instanceRelations,
  ...organizationRelations,
  ...auditRelations,
};
