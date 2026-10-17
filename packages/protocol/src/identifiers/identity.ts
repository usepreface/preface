import { createBrandedId } from "#/common/branded-id";
export const IdentityConnectionId = createBrandedId("IdentityConnectionId");
export type IdentityConnectionId = typeof IdentityConnectionId.Type;
export const AccountId = createBrandedId("AccountId");
export type AccountId = typeof AccountId.Type;
export const AuthFlowId = createBrandedId("AuthFlowId");
export type AuthFlowId = typeof AuthFlowId.Type;
