import { Schema } from "effect";

import { OrganizationRoleId, TeamId } from "#/identifiers/organization";

export const InvitationRoleIds = Schema.Array(OrganizationRoleId).check(
  Schema.isMinLength(1),
  Schema.isMaxLength(20),
  Schema.isUnique(),
);

export const InvitationTeams = Schema.Array(
  Schema.Struct({ teamId: TeamId, roleIds: Schema.optionalKey(InvitationRoleIds) }),
).check(
  Schema.isMaxLength(20),
  Schema.makeFilter(
    (teams) =>
      new Set(teams.map((team) => team.teamId)).size === teams.length || "Teams must be unique",
  ),
);
export type InvitationTeams = typeof InvitationTeams.Type;
