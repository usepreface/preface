import { DateTime, Schema } from "effect";

import { UserId } from "#/identifiers/user";

export const SetPasswordCredential = Schema.Struct({
  userId: UserId,
  passwordHash: Schema.NonEmptyString,
});
export type SetPasswordCredential = typeof SetPasswordCredential.Type;

export const PasswordCredential = Schema.Struct({
  ...SetPasswordCredential.fields,
  createdAt: Schema.DateTimeUtcFromDate,
  passwordChangedAt: Schema.DateTimeUtcFromDate,
}).check(
  Schema.makeFilter(
    (credential) =>
      DateTime.toEpochMillis(credential.passwordChangedAt) >=
        DateTime.toEpochMillis(credential.createdAt) ||
      "Password change cannot precede credential creation",
  ),
);
export type PasswordCredential = typeof PasswordCredential.Type;
