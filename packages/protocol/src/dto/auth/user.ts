import { Schema } from "effect";

import { DisplayName as UserDisplayName } from "#/common/display-name";
import { EmailAddress as UserEmail } from "#/common/email";
import { UserId } from "#/identifiers/user";

export const PublicUser = Schema.Struct({
  id: UserId,
  displayName: UserDisplayName,
  email: UserEmail,
  emailVerifiedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export type PublicUser = typeof PublicUser.Type;
