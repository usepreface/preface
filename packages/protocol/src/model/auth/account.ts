import { Schema } from "effect";

import { GoogleSubject } from "#/common/identity";
import { AccountId, IdentityConnectionId } from "#/identifiers/identity";
import { UserId } from "#/identifiers/user";
export const Account = Schema.Struct({
  id: AccountId,
  userId: UserId,
  identityConnectionId: IdentityConnectionId,
  issuer: Schema.Literal("https://accounts.google.com"),
  subject: GoogleSubject,
  providerEmail: Schema.NullOr(Schema.String),
  providerEmailVerified: Schema.NullOr(Schema.Boolean),
  lastUsedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  unlinkedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type Account = typeof Account.Type;
