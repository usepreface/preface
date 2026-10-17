import { createBrandedId } from "#/common/branded-id";

export const UserId = createBrandedId("UserId");
export type UserId = typeof UserId.Type;
