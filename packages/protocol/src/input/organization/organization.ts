import { Schema, SchemaGetter } from "effect";

import { DescriptionInput } from "#/common/description";
import { DisplayNameInput as name } from "#/common/display-name";
import { OrganizationRoleKey, RolePermissions, RoleScope } from "#/common/organization";

const key = Schema.String.pipe(
  Schema.decodeTo(OrganizationRoleKey, {
    decode: SchemaGetter.transform((value) => value.trim().toLowerCase()),
    encode: SchemaGetter.passthrough(),
  }),
);
export const UpdateOrganizationInput = Schema.Struct({
  metadata: Schema.optionalKey(
    Schema.Struct({
      name: Schema.optionalKey(name),
      description: Schema.optionalKey(Schema.NullOr(DescriptionInput)),
    }),
  ),
}).check(Schema.makeFilter((input) => input.metadata !== undefined || "Provide metadata"));
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
