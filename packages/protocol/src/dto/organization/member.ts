import { Schema } from "effect";

import { OrganizationName, OrganizationRoleKey, OrganizationRoleKind } from "#/common/organization";
import { OrganizationMemberId, OrganizationRoleId } from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";

export const PublicOrganizationMember = Schema.Struct({
  id: OrganizationMemberId,
  userId: UserId,
  displayName: OrganizationName,
  joinedAt: Schema.DateTimeUtcFromString,
  suspendedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  removedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  roles: Schema.Array(
    Schema.Struct({
      id: OrganizationRoleId,
      key: OrganizationRoleKey,
      name: OrganizationName,
      kind: OrganizationRoleKind,
    }),
  ),
});
export type PublicOrganizationMember = typeof PublicOrganizationMember.Type;
export const ListOrganizationMembersQuery = Schema.Struct({
  cursor: Schema.optionalKey(OrganizationMemberId),
  limit: Schema.optionalKey(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 }))),
  includeRemoved: Schema.optionalKey(Schema.Boolean),
});
export type ListOrganizationMembersQuery = typeof ListOrganizationMembersQuery.Type;
export const OrganizationMemberList = Schema.Struct({
  members: Schema.Array(PublicOrganizationMember),
  nextCursor: Schema.NullOr(OrganizationMemberId),
});
export const TransferOrganizationOwnershipRequest = Schema.Struct({
  targetMemberId: OrganizationMemberId,
});
