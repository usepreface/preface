import { Schema } from "effect";

import { EmailAddressInput } from "#/common/email";
import { SecretTokenFromString } from "#/common/secret-token";
import { VerificationCodeFromString } from "#/common/verification-code";
import { VerificationId } from "#/identifiers/auth";

export const RequestEmailSignInInput = Schema.Struct({
  email: EmailAddressInput,
});
export type RequestEmailSignInInput = typeof RequestEmailSignInInput.Type;
export const ResendEmailSignInInput = Schema.Struct({
  challengeId: VerificationId,
  browserToken: SecretTokenFromString,
});
export type ResendEmailSignInInput = typeof ResendEmailSignInInput.Type;
export const VerifyEmailSignInInput = Schema.Union([
  Schema.Struct({
    challengeId: VerificationId,
    browserToken: SecretTokenFromString,
    method: Schema.Literal("code"),
    code: VerificationCodeFromString,
  }),
  Schema.Struct({
    challengeId: VerificationId,
    browserToken: SecretTokenFromString,
    method: Schema.Literal("magic_link"),
    token: SecretTokenFromString,
  }),
]);
export type VerifyEmailSignInInput = typeof VerifyEmailSignInInput.Type;
