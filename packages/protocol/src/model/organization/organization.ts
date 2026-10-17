import { Schema } from "effect";

import { OrganizationName, OrganizationSlug } from "#/common/organization";
import { OrganizationId } from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";

export const CreateOrganization = Schema.Struct({
  name: OrganizationName,
  slug: OrganizationSlug,
  createdByUserId: UserId,
});
export type CreateOrganization = typeof CreateOrganization.Type;
export const Organization = Schema.Struct({
  id: OrganizationId,
  ...CreateOrganization.fields,
  archivedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type Organization = typeof Organization.Type;

export const UpdateOrganization = Schema.Struct({ name: OrganizationName, slug: OrganizationSlug });
export type UpdateOrganization = typeof UpdateOrganization.Type;
