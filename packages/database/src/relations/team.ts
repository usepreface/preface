import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";
export const teamRelations = defineRelationsPart(schema, (r) => ({
  team: {
    organization: r.one.organization({
      from: r.team.organizationId,
      to: r.organization.id,
      optional: false,
    }),
    members: r.many.teamMember({
      from: [r.team.id, r.team.organizationId],
      to: [r.teamMember.teamId, r.teamMember.organizationId],
    }),
  },
  teamMember: {
    team: r.one.team({
      from: [r.teamMember.teamId, r.teamMember.organizationId],
      to: [r.team.id, r.team.organizationId],
      optional: false,
    }),
    member: r.one.organizationMember({
      from: [r.teamMember.memberId, r.teamMember.organizationId],
      to: [r.organizationMember.id, r.organizationMember.organizationId],
      optional: false,
    }),
  },
}));
