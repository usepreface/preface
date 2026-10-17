import { Schema } from "effect";

import { SecretTokenFromString } from "#/common/secret-token";
import { VerificationCode } from "#/common/verification-code";
import { VerificationId } from "#/identifiers/auth";

const token = Schema.toEncoded(SecretTokenFromString).annotate({ writeOnly: true });
export const RequestEmailSignInRequest = Schema.Struct({ email: Schema.String }).annotate({
  identifier: "RequestEmailSignInRequest",
});
export const ResendEmailSignInRequest = Schema.Struct({ challengeId: VerificationId });
export const VerifyEmailSignInRequest = Schema.Union([
  Schema.Struct({
    challengeId: VerificationId,
    method: Schema.Literal("code"),
    code: VerificationCode.annotate({ writeOnly: true }),
  }),
  Schema.Struct({ challengeId: VerificationId, method: Schema.Literal("magic_link"), token }),
]).annotate({ identifier: "VerifyEmailSignInRequest" });
export const EmailSignInChallenge = Schema.Struct({
  challengeId: VerificationId,
  expiresAt: Schema.DateTimeUtcFromString,
});
export type EmailSignInChallenge = typeof EmailSignInChallenge.Type;
