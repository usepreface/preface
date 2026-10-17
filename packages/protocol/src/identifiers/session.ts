import { createBrandedId } from "#/common/branded-id";

export const SessionId = createBrandedId("SessionId");
export type SessionId = typeof SessionId.Type;
