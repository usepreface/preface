import { Schema } from "effect";

export const MetadataImage = Schema.Struct({
  type: Schema.Literal("image"),
  value: Schema.String.check(Schema.isPattern(/^https?:\/\/[^\s]+$/), Schema.isMaxLength(2048)),
});
export type MetadataImage = typeof MetadataImage.Type;
