import { Schema } from "effect";

import { SessionId } from "#/identifiers/session";
import { User } from "#/model/auth/user";

export const SecretToken = Schema.Redacted(
  Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(128)),
);
export const SecretTokenFromString = Schema.RedactedFromValue(
  Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(128)),
  { disallowEncode: true },
);

export const PublicUser = Schema.Struct({
  id: User.fields.id,
  displayName: User.fields.displayName,
  email: User.fields.email,
  emailVerifiedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export type PublicUser = typeof PublicUser.Type;

export const PublicSession = Schema.Struct({
  id: SessionId,
  expiresAt: Schema.DateTimeUtcFromString,
});
export type PublicSession = typeof PublicSession.Type;

// Constructed by authentication, never accepted as a request body.
export const SessionActor = Schema.Struct({ user: PublicUser, session: PublicSession });
export type SessionActor = typeof SessionActor.Type;

export class AuthenticationError extends Schema.TaggedError<AuthenticationError>()(
  "AuthenticationError",
  { code: Schema.Literal("UNAUTHENTICATED") },
) {}
