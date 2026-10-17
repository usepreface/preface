import { createBrandedId } from "#/common/branded-id";

export const InstallationId = createBrandedId("InstallationId");
export type InstallationId = typeof InstallationId.Type;

export const InstanceOwnerId = createBrandedId("InstanceOwnerId");
export type InstanceOwnerId = typeof InstanceOwnerId.Type;
