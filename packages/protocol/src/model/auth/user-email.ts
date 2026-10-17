import { Schema } from "effect";

import { UserEmailId } from "#/identifiers/auth";
import { UserId } from "#/identifiers/user";
import { UserEmail } from "#/values/user";

export const CreateUserEmail = Schema.Struct({
  userId: UserId,
  email: UserEmail,
  isPrimary: Schema.Boolean,
  loginEnabled: Schema.Boolean,
  verifiedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type CreateUserEmail = typeof CreateUserEmail.Type;
export const UserEmailAddress = Schema.Struct({
  id: UserEmailId,
  ...CreateUserEmail.fields,
  removedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type UserEmailAddress = typeof UserEmailAddress.Type;
