import { Schema } from "effect";

import { OrganizationSlug } from "#/common/organization";
import {
  OrganizationId,
  OrganizationMemberId,
  TeamId,
  TeamMemberId,
} from "#/identifiers/organization";
import { TeamMetadata } from "#/metadata/team";
export const CreateTeam = Schema.Struct({
  organizationId: OrganizationId,
  slug: OrganizationSlug,
  metadata: TeamMetadata,
  createdByMemberId: OrganizationMemberId,
});
export type CreateTeam = typeof CreateTeam.Type;
export const Team = Schema.Struct({
  id: TeamId,
  ...CreateTeam.fields,
  archivedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type Team = typeof Team.Type;
export const TeamMember = Schema.Struct({
  id: TeamMemberId,
  organizationId: OrganizationId,
  teamId: TeamId,
  memberId: OrganizationMemberId,
  addedByMemberId: OrganizationMemberId,
  joinedAt: Schema.DateTimeUtcFromDate,
  removedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type TeamMember = typeof TeamMember.Type;
