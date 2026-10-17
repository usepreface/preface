import { createBrandedId } from "#/common/branded-id";

export const UserEmailId = createBrandedId("UserEmailId");
export type UserEmailId = typeof UserEmailId.Type;
export const VerificationId = createBrandedId("VerificationId");
export type VerificationId = typeof VerificationId.Type;
export const SessionAuthenticationId = createBrandedId("SessionAuthenticationId");
export type SessionAuthenticationId = typeof SessionAuthenticationId.Type;
