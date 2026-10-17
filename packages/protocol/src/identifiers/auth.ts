import { Schema } from "effect";

export const UserEmailId = Schema.String.check(Schema.isUUID(7)).pipe(Schema.brand("UserEmailId"));
export type UserEmailId = typeof UserEmailId.Type;
export const VerificationId = Schema.String.check(Schema.isUUID(7)).pipe(
  Schema.brand("VerificationId"),
);
export type VerificationId = typeof VerificationId.Type;
export const SessionAuthenticationId = Schema.String.check(Schema.isUUID(7)).pipe(
  Schema.brand("SessionAuthenticationId"),
);
export type SessionAuthenticationId = typeof SessionAuthenticationId.Type;
