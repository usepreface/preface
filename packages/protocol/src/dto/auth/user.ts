import { Schema } from "effect";

import { EmailAddress as UserEmail } from "#/common/email";
import { UserId } from "#/identifiers/user";
import { UserMetadata } from "#/metadata/user";

export const PublicUser = Schema.Struct({
  id: UserId,
  metadata: UserMetadata,
  email: UserEmail,
  emailVerifiedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export type PublicUser = typeof PublicUser.Type;
