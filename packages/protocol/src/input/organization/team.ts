import { Schema, SchemaGetter } from "effect";

import { DescriptionInput } from "#/common/description";
import { DisplayNameInput } from "#/common/display-name";
import { TeamSlug } from "#/common/organization";
const slug = Schema.String.pipe(
  Schema.decodeTo(TeamSlug, {
    decode: SchemaGetter.transform((value) => value.trim().toLowerCase()),
    encode: SchemaGetter.passthrough(),
  }),
);
export const CreateTeamInput = Schema.Struct({
  metadata: Schema.Struct({
    name: DisplayNameInput,
    description: Schema.optionalKey(DescriptionInput),
  }),
  slug,
});
export type CreateTeamInput = typeof CreateTeamInput.Type;
export const UpdateTeamInput = Schema.Struct({
  metadata: Schema.optionalKey(
    Schema.Struct({
      name: Schema.optionalKey(DisplayNameInput),
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
export type UpdateTeamInput = typeof UpdateTeamInput.Type;
