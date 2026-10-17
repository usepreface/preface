import { Schema } from "effect";

import { UserId } from "#/identifiers/user";

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

export const User = Schema.Struct({
  id: UserId,
  displayName: UserDisplayName,
  email: UserEmail,
  emailVerifiedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  disabledAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type User = typeof User.Type;

export const CreateUser = Schema.Struct({ displayName: UserDisplayName, email: UserEmail });
export type CreateUser = typeof CreateUser.Type;
