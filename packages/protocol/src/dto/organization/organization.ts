import { Schema } from "effect";

import { OrganizationSlug, OrganizationPermissions } from "#/common/organization";
import { PublicOrganizationMember } from "#/dto/organization/member";
import { OrganizationId, OrganizationMemberId } from "#/identifiers/organization";
import { OrganizationMetadata } from "#/metadata/organization";

export const PublicOrganization = Schema.Struct({
  id: OrganizationId,
  metadata: OrganizationMetadata,
  slug: OrganizationSlug,
  archivedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  createdAt: Schema.DateTimeUtcFromString,
  updatedAt: Schema.DateTimeUtcFromString,
});
export type PublicOrganization = typeof PublicOrganization.Type;
export const OrganizationAccessInfo = Schema.Struct({
  memberId: OrganizationMemberId,
  isOwner: Schema.Boolean,
  permissions: OrganizationPermissions,
});
export type OrganizationAccessInfo = typeof OrganizationAccessInfo.Type;
export const OrganizationDetail = Schema.Struct({
  organization: PublicOrganization,
  membership: PublicOrganizationMember,
  access: OrganizationAccessInfo,
});
export type OrganizationDetail = typeof OrganizationDetail.Type;
export const CreateOrganizationRequest = Schema.Struct({
  metadata: Schema.Struct({ name: Schema.String, description: Schema.optionalKey(Schema.String) }),
  slug: Schema.String,
});
export const UpdateOrganizationRequest = Schema.Struct({
  metadata: Schema.optionalKey(
    Schema.Struct({
      name: Schema.optionalKey(Schema.String),
      description: Schema.optionalKey(Schema.NullOr(Schema.String)),
    }),
  ),
  slug: Schema.optionalKey(Schema.String),
});
export const ListOrganizationsQuery = Schema.Struct({
  cursor: Schema.optionalKey(OrganizationId),
  limit: Schema.optionalKey(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 }))),
  includeArchived: Schema.optionalKey(Schema.Boolean),
});
export type ListOrganizationsQuery = typeof ListOrganizationsQuery.Type;
export const OrganizationList = Schema.Struct({
  organizations: Schema.Array(PublicOrganization),
  nextCursor: Schema.NullOr(OrganizationId),
});
export const InstanceCapabilities = Schema.Struct({ canCreateOrganization: Schema.Boolean });
