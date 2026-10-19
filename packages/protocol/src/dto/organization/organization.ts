import { Schema } from "effect";

import { OrganizationPermissions } from "#/common/organization";
import { PublicOrganizationMember } from "#/dto/organization/member";
import { OrganizationId, OrganizationMemberId } from "#/identifiers/organization";
import { OrganizationMetadata } from "#/metadata/organization";

export const PublicOrganization = Schema.Struct({
  id: OrganizationId,
  metadata: OrganizationMetadata,
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

export const UpdateOrganizationRequest = Schema.Struct({
  metadata: Schema.optionalKey(
    Schema.Struct({
      name: Schema.optionalKey(Schema.String),
      description: Schema.optionalKey(Schema.NullOr(Schema.String)),
    }),
  ),
});

export const InstanceCapabilities = Schema.Struct({ isInstanceOwner: Schema.Boolean });
