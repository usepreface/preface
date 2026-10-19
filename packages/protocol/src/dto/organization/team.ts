import { Schema } from "effect";

import { TeamSlug, TeamPermission } from "#/common/organization";
import { PageSize } from "#/common/pagination";
import { PublicOrganizationRole } from "#/dto/organization/role";
import { TeamId, TeamMemberId, OrganizationMemberId } from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";
import { TeamMetadata } from "#/metadata/team";
import { UserMetadata } from "#/metadata/user";

export const PublicTeam = Schema.Struct({
  id: TeamId,
  slug: TeamSlug,
  metadata: TeamMetadata,
  archivedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  createdAt: Schema.DateTimeUtcFromString,
  updatedAt: Schema.DateTimeUtcFromString,
});
export type PublicTeam = typeof PublicTeam.Type;

export const CreateTeamRequest = Schema.Struct({
  slug: Schema.String,
  metadata: Schema.Struct({ name: Schema.String, description: Schema.optionalKey(Schema.String) }),
});

export const UpdateTeamRequest = Schema.Struct({
  slug: Schema.optionalKey(Schema.String),
  metadata: Schema.optionalKey(
    Schema.Struct({
      name: Schema.optionalKey(Schema.String),
      description: Schema.optionalKey(Schema.NullOr(Schema.String)),
    }),
  ),
});

export const ListTeamsQuery = Schema.Struct({
  cursor: Schema.optionalKey(TeamId),
  limit: Schema.optionalKey(PageSize),
  includeArchived: Schema.optionalKey(Schema.Boolean),
});
export type ListTeamsQuery = typeof ListTeamsQuery.Type;

export const TeamList = Schema.Struct({
  teams: Schema.Array(PublicTeam),
  nextCursor: Schema.NullOr(TeamId),
});

export const TeamAccessInfo = Schema.Struct({
  isMember: Schema.Boolean,
  permissions: Schema.Array(TeamPermission),
});

export const PublicTeamMember = Schema.Struct({
  id: TeamMemberId,
  memberId: OrganizationMemberId,
  userId: UserId,
  metadata: UserMetadata,
  joinedAt: Schema.DateTimeUtcFromString,
  roles: Schema.Array(PublicOrganizationRole),
});

export const ListTeamMembersQuery = Schema.Struct({
  cursor: Schema.optionalKey(TeamMemberId),
  limit: Schema.optionalKey(PageSize),
});
export type ListTeamMembersQuery = typeof ListTeamMembersQuery.Type;

export const TeamMemberList = Schema.Struct({
  members: Schema.Array(PublicTeamMember),
  nextCursor: Schema.NullOr(TeamMemberId),
});
