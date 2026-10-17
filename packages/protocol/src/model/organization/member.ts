import { Schema } from "effect";

import { OrganizationId, OrganizationMemberId } from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";

export const CreateOrganizationMember = Schema.Struct({
  organizationId: OrganizationId,
  userId: UserId,
});
export type CreateOrganizationMember = typeof CreateOrganizationMember.Type;
export const OrganizationMember = Schema.Struct({
  id: OrganizationMemberId,
  ...CreateOrganizationMember.fields,
  joinedAt: Schema.DateTimeUtcFromDate,
  suspendedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  removedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type OrganizationMember = typeof OrganizationMember.Type;
