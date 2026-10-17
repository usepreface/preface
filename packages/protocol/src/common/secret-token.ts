import { Schema } from "effect";

const SecretTokenValue = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(128));
export const SecretToken = Schema.Redacted(SecretTokenValue);
export const SecretTokenFromString = Schema.RedactedFromValue(SecretTokenValue, {
  disallowEncode: true,
});
