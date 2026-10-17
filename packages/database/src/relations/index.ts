import { defineRelationsPart } from "drizzle-orm";

import { auditRelations } from "#/relations/audit";
import { authRelations } from "#/relations/auth";
import { identityRelations } from "#/relations/identity";
import { instanceRelations } from "#/relations/instance";
import { organizationRelations } from "#/relations/organization";
import { organizationAuthenticationRelations } from "#/relations/organization-authentication";
import { teamRelations } from "#/relations/team";
import * as schema from "#/schema/index";

// The schema-wide part must come first to retain tables without explicit relations.
const schemaRelations = defineRelationsPart(schema);
export const relations = {
  ...schemaRelations,
  ...authRelations,
  ...instanceRelations,
  ...organizationRelations,
  ...organizationAuthenticationRelations,
  ...teamRelations,
  ...auditRelations,
  ...identityRelations,
};
