import { Schema } from "effect";
export const UpdateProfileRequest = Schema.Struct({
  metadata: Schema.Struct({
    name: Schema.optionalKey(Schema.String),
    title: Schema.optionalKey(Schema.NullOr(Schema.String)),
    bio: Schema.optionalKey(Schema.NullOr(Schema.String)),
  }),
});
