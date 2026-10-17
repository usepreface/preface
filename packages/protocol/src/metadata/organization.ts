import { Schema } from "effect";

import { Description } from "#/common/description";
import { DisplayName } from "#/common/display-name";
import { MetadataImage } from "#/common/metadata-image";

export const OrganizationMetadataV1 = Schema.Struct({
  version: Schema.Literal(1),
  name: DisplayName,
  logo: Schema.optionalKey(MetadataImage),
  description: Schema.optionalKey(Description),
});
export const OrganizationMetadata = OrganizationMetadataV1;
export type OrganizationMetadata = typeof OrganizationMetadata.Type;
