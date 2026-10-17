import { Schema } from "effect";

import { UserId } from "#/identifiers/user";
import { UserDisplayName, UserEmail } from "#/values/user";

export const PublicUser = Schema.Struct({
  id: UserId,
  displayName: UserDisplayName,
  email: UserEmail,
  emailVerifiedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export type PublicUser = typeof PublicUser.Type;
