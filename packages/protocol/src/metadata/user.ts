import { Schema } from "effect";

import { Description, ProfileTitle } from "#/common/description";
import { DisplayName } from "#/common/display-name";
import { MetadataImage } from "#/common/metadata-image";

export const UserMetadataV1 = Schema.Struct({
  version: Schema.Literal(1),
  name: DisplayName,
  image: Schema.optionalKey(MetadataImage),
  title: Schema.optionalKey(ProfileTitle),
  bio: Schema.optionalKey(Description),
});
export const UserMetadata = UserMetadataV1;
export type UserMetadata = typeof UserMetadata.Type;
