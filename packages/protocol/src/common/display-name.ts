import { Schema, SchemaGetter } from "effect";

export const DisplayName = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(120),
);
export const DisplayNameInput = Schema.String.pipe(
  Schema.decodeTo(DisplayName, {
    decode: SchemaGetter.transform((name) => name.trim()),
    encode: SchemaGetter.passthrough(),
  }),
);
