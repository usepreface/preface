import { Schema } from "effect";

import { UserId } from "#/identifiers/user";
import { UserDisplayName, UserEmail } from "#/values/user";

export { UserDisplayName, UserEmail } from "#/values/user";

export const User = Schema.Struct({
  id: UserId,
  displayName: UserDisplayName,
  disabledAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type User = typeof User.Type;

// A repository projection, not a second writable source of email ownership.
export const UserProfile = Schema.Struct({
  ...User.fields,
  email: UserEmail,
  emailVerifiedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type UserProfile = typeof UserProfile.Type;
export const CreateUser = Schema.Struct({ displayName: UserDisplayName });
export type CreateUser = typeof CreateUser.Type;
