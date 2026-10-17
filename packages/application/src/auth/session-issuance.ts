import { DateTime, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { AuthenticationError, type UserEmailId, type UserId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { EmailAuthenticationMethod } from "@usepreface/protocol/model";

import { sessionLifetime } from "#/security/policy";
import type { IssuedToken } from "#/security/token";

// Call within the workflow transaction. The user lock also coordinates logout everywhere.
export const makeSessionIssuance = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("Application.auth.issueSession")(function* (input: {
    readonly userId: UserId;
    readonly userEmailId: UserEmailId;
    readonly credential: IssuedToken;
    readonly method: EmailAuthenticationMethod;
  }) {
    const user = yield* repository.auth.user.lockById(input.userId);
    const email = yield* repository.auth.userEmail.findById(input.userEmailId);
    if (
      user === undefined ||
      user.disabledAt !== null ||
      email === undefined ||
      email.userId !== user.id ||
      email.removedAt !== null ||
      email.verifiedAt === null ||
      !email.loginEnabled
    )
      return yield* new AuthenticationError({ code: "UNAUTHENTICATED" });

    const profile = yield* repository.auth.user.findProfileById(user.id);
    if (profile === undefined) return yield* new AuthenticationError({ code: "UNAUTHENTICATED" });

    const now = yield* DateTime.now;
    const session = yield* repository.auth.session.create({
      userId: user.id,
      tokenHash: input.credential.hash,
      expiresAt: DateTime.addDuration(now, sessionLifetime),
    });
    yield* repository.auth.sessionAuthentication.create({
      sessionId: session.id,
      userId: user.id,
      userEmailId: email.id,
      method: input.method,
      authenticatedAt: now,
      expiresAt: session.expiresAt,
      assurance: { version: 1, emailVerified: true },
    });
    yield* repository.audit.event.append({
      actorKind: "user",
      actorUserId: user.id,
      eventType: "auth.session_created",
      targetType: "session",
      targetId: session.id,
      metadata: {},
    });
    yield* repository.audit.event.append({
      actorKind: "user",
      actorUserId: user.id,
      eventType: "auth.session_authenticated",
      targetType: "session",
      targetId: session.id,
      metadata: { method: input.method, userEmailId: email.id },
    });

    const actor: SessionActor = {
      user: {
        id: user.id,
        displayName: user.displayName,
        email: profile.email,
        emailVerifiedAt: profile.emailVerifiedAt,
      },
      session: { id: session.id, expiresAt: session.expiresAt },
    };
    return { actor, sessionToken: input.credential.token };
  });
});
