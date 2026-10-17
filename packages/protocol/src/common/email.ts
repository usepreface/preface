import { Schema, SchemaGetter } from "effect";

// The complete address is case-insensitive; preserve provider-specific dots and plus tags.
export const EmailAddress = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isLowercased(),
  Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
);
export const EmailAddressInput = Schema.String.pipe(
  Schema.decodeTo(EmailAddress, {
    decode: SchemaGetter.transform((email) => email.trim().toLowerCase()),
    encode: SchemaGetter.passthrough(),
  }),
);
