import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";

export const organizationAuthenticationRelations = defineRelationsPart(schema, (r) => ({
  organizationAuthRecoveryToken: {
    member: r.one.organizationMember({
      from: [
        r.organizationAuthRecoveryToken.memberId,
        r.organizationAuthRecoveryToken.organizationId,
      ],
      to: [r.organizationMember.id, r.organizationMember.organizationId],
      optional: false,
    }),
  },
}));
