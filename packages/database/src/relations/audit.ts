import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";

export const auditRelations = defineRelationsPart(schema, (r) => ({
  auditEvent: {
    organization: r.one.organization({ from: r.auditEvent.organizationId, to: r.organization.id }),
    actor: r.one.user({ from: r.auditEvent.actorUserId, to: r.user.id }),
  },
}));
