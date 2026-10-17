import { Schema } from "effect";

import { DisplayName as UserDisplayName } from "#/common/display-name";
import { EmailAddress as UserEmail } from "#/common/email";
import { UserId } from "#/identifiers/user";

export { DisplayName as UserDisplayName } from "#/common/display-name";
export { EmailAddress as UserEmail } from "#/common/email";

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
