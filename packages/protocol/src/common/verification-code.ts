import { Schema } from "effect";

export const VerificationCode = Schema.String.check(Schema.isPattern(/^\d{8}$/));
export const VerificationCodeFromString = Schema.RedactedFromValue(VerificationCode, {
  disallowEncode: true,
});
