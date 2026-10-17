import { Schema } from "effect";

import { DescriptionInput, ProfileTitleInput } from "#/common/description";
import { DisplayNameInput } from "#/common/display-name";
export const UpdateProfileInput = Schema.Struct({
  metadata: Schema.Struct({
    name: Schema.optionalKey(DisplayNameInput),
    title: Schema.optionalKey(Schema.NullOr(ProfileTitleInput)),
    bio: Schema.optionalKey(Schema.NullOr(DescriptionInput)),
  }),
});
export type UpdateProfileInput = typeof UpdateProfileInput.Type;
