import { Schema, SchemaGetter } from "effect";

import { DisplayNameInput as name } from "#/common/display-name";
import {
  OrganizationSlug,
  OrganizationRoleKey,
  OrganizationPermissions,
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
export const CreateOrganizationInput = Schema.Struct({ name, slug });
export type CreateOrganizationInput = typeof CreateOrganizationInput.Type;
export const UpdateOrganizationInput = Schema.Struct({
  name: Schema.optionalKey(name),
  slug: Schema.optionalKey(slug),
}).check(
  Schema.makeFilter(
    (input) => input.name !== undefined || input.slug !== undefined || "Provide name or slug",
  ),
);
export type UpdateOrganizationInput = typeof UpdateOrganizationInput.Type;
export const CreateOrganizationRoleInput = Schema.Struct({
  name,
  key,
  permissions: OrganizationPermissions,
});
export type CreateOrganizationRoleInput = typeof CreateOrganizationRoleInput.Type;
export const UpdateOrganizationRoleInput = Schema.Struct({
  name: Schema.optionalKey(name),
  permissions: Schema.optionalKey(OrganizationPermissions),
}).check(
  Schema.makeFilter(
    (input) =>
      input.name !== undefined || input.permissions !== undefined || "Provide name or permissions",
  ),
);
export type UpdateOrganizationRoleInput = typeof UpdateOrganizationRoleInput.Type;
