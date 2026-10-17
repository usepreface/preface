import { Schema, SchemaGetter } from "effect";

import { DescriptionInput } from "#/common/description";
import { DisplayNameInput as name } from "#/common/display-name";
import {
  OrganizationSlug,
  OrganizationRoleKey,
  RolePermissions,
  RoleScope,
} from "#/common/organization";

const slug = Schema.String.pipe(
  Schema.decodeTo(OrganizationSlug, {
    decode: SchemaGetter.transform((value) => value.trim().toLowerCase()),
    encode: SchemaGetter.passthrough(),
  }),
);
const key = Schema.String.pipe(
  Schema.decodeTo(OrganizationRoleKey, {
    decode: SchemaGetter.transform((value) => value.trim().toLowerCase()),
    encode: SchemaGetter.passthrough(),
  }),
);
export const CreateOrganizationInput = Schema.Struct({
  metadata: Schema.Struct({ name, description: Schema.optionalKey(DescriptionInput) }),
  slug,
});
export type CreateOrganizationInput = typeof CreateOrganizationInput.Type;
export const UpdateOrganizationInput = Schema.Struct({
  metadata: Schema.optionalKey(
    Schema.Struct({
      name: Schema.optionalKey(name),
      description: Schema.optionalKey(Schema.NullOr(DescriptionInput)),
    }),
  ),
  slug: Schema.optionalKey(slug),
}).check(
  Schema.makeFilter(
    (input) =>
      input.metadata !== undefined || input.slug !== undefined || "Provide metadata or slug",
  ),
);
export type UpdateOrganizationInput = typeof UpdateOrganizationInput.Type;
export const CreateOrganizationRoleInput = Schema.Struct({
  scopeKind: Schema.optionalKey(RoleScope),
  name,
  key,
  permissions: RolePermissions,
});
export type CreateOrganizationRoleInput = typeof CreateOrganizationRoleInput.Type;
export const UpdateOrganizationRoleInput = Schema.Struct({
  name: Schema.optionalKey(name),
  permissions: Schema.optionalKey(RolePermissions),
}).check(
  Schema.makeFilter(
    (input) =>
      input.name !== undefined || input.permissions !== undefined || "Provide name or permissions",
  ),
);
export type UpdateOrganizationRoleInput = typeof UpdateOrganizationRoleInput.Type;
