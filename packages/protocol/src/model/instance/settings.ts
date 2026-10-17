import { Schema } from "effect";

import { DisplayName as InstanceDisplayName } from "#/common/display-name";

export { DisplayName as InstanceDisplayName } from "#/common/display-name";

export const InstanceSettings = Schema.Struct({
  installationId: Schema.Literal(1),
  displayName: InstanceDisplayName,
  revision: Schema.Int.check(Schema.isGreaterThan(0)),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type InstanceSettings = typeof InstanceSettings.Type;

export const UpdateInstanceSettings = Schema.Struct({
  displayName: InstanceSettings.fields.displayName,
  revision: InstanceSettings.fields.revision,
});
export type UpdateInstanceSettings = typeof UpdateInstanceSettings.Type;
