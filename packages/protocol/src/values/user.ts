import { Schema } from "effect";

export const UserDisplayName = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(120),
);

// Preface treats the complete address as case-insensitive, without provider-specific rewriting.
export const UserEmail = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isLowercased(),
  Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
);
