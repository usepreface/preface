import { Schema, SchemaGetter } from "effect";

import { VerificationId } from "#/identifiers/auth";
import { SecretTokenFromString } from "#/values/secret-token";
import { UserEmail } from "#/values/user";

export const RequestEmailSignInInput = Schema.Struct({
  email: Schema.String.pipe(
    Schema.decodeTo(UserEmail, {
      decode: SchemaGetter.transform((email) => email.trim().toLowerCase()),
      encode: SchemaGetter.passthrough(),
    }),
  ),
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
    code: Schema.RedactedFromValue(Schema.String.check(Schema.isPattern(/^\d{8}$/)), {
      disallowEncode: true,
    }),
  }),
  Schema.Struct({
    challengeId: VerificationId,
    browserToken: SecretTokenFromString,
    method: Schema.Literal("magic_link"),
    token: SecretTokenFromString,
  }),
]);
export type VerifyEmailSignInInput = typeof VerifyEmailSignInInput.Type;
