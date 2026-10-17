import { Schema } from "effect";

import { PublicUser } from "#/dto/auth/user";
import { SessionId } from "#/identifiers/session";

export const PublicSession = Schema.Struct({
  id: SessionId,
  expiresAt: Schema.DateTimeUtcFromString,
});
export type PublicSession = typeof PublicSession.Type;

// Constructed by authentication, never accepted as a request body.
export const SessionActor = Schema.Struct({ user: PublicUser, session: PublicSession });
export type SessionActor = typeof SessionActor.Type;
