import { Schema } from "effect";

export const SecretToken = Schema.Redacted(
  Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(128)),
);
export const SecretTokenFromString = Schema.RedactedFromValue(
  Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(128)),
  { disallowEncode: true },
);
