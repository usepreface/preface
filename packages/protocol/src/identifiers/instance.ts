import { Schema } from "effect";

export const InstallationId = Schema.String.check(Schema.isUUID(7)).pipe(
  Schema.brand("InstallationId"),
);
export type InstallationId = typeof InstallationId.Type;

export const InstanceOwnerId = Schema.String.check(Schema.isUUID(7)).pipe(
  Schema.brand("InstanceOwnerId"),
);
export type InstanceOwnerId = typeof InstanceOwnerId.Type;
