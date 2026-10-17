import { Schema, SchemaGetter } from "effect";
export const Description = Schema.String.check(
  Schema.isMaxLength(1024),
  Schema.makeFilter((value) => value === value.trim() || "Description must be trimmed"),
);
export const DescriptionInput = Schema.String.pipe(
  Schema.decodeTo(Description, {
    decode: SchemaGetter.transform((value) => value.trim()),
    encode: SchemaGetter.passthrough(),
  }),
);
export const ProfileTitle = Schema.String.check(
  Schema.isMaxLength(120),
  Schema.makeFilter((value) => value === value.trim() || "Title must be trimmed"),
);
export const ProfileTitleInput = Schema.String.pipe(
  Schema.decodeTo(ProfileTitle, {
    decode: SchemaGetter.transform((value) => value.trim()),
    encode: SchemaGetter.passthrough(),
  }),
);
