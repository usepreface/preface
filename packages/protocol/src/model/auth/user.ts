import { Schema } from "effect";

import { UserId } from "#/identifiers/user";
import { UserDisplayName, UserEmail } from "#/values/user";

export { UserDisplayName, UserEmail } from "#/values/user";

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
