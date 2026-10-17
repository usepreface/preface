import type { Redacted } from "effect";
import { DateTime, Duration, Effect } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { AuthenticationError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { sessionActivityInterval, sessionIdleTimeout } from "#/security/policy";
import { TokenService } from "#/security/token";

export const makeSessionApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const tokens = yield* TokenService;

  const resolve = Effect.fn("Application.auth.session.resolve")(function* (
    token: Redacted.Redacted<string>,
  ) {
    const hash = yield* tokens.digestSession(token);
    const session = yield* repository.auth.session.findActiveByTokenHash(hash);
    if (session === undefined) return yield* new AuthenticationError({ code: "UNAUTHENTICATED" });

    const user = yield* repository.auth.user.findById(session.userId);
    const now = DateTime.toEpochMillis(yield* DateTime.now);
    const inactiveFor = now - DateTime.toEpochMillis(session.lastSeenAt);
    if (
      user === undefined ||
      user.disabledAt !== null ||
      inactiveFor >= Duration.toMillis(sessionIdleTimeout)
    ) {
      return yield* new AuthenticationError({ code: "UNAUTHENTICATED" });
    }

    if (inactiveFor >= Duration.toMillis(sessionActivityInterval)) {
      const updated = yield* repository.auth.session.recordActivity(session.id, sessionIdleTimeout);
      if (updated === undefined) return yield* new AuthenticationError({ code: "UNAUTHENTICATED" });
    }

    const actor: SessionActor = {
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      session: { id: session.id, expiresAt: session.expiresAt },
    };
    return actor;
  });

  // actor comes from resolve(), never from caller-controlled body identities.
  const revokeCurrent = Effect.fn("Application.auth.session.revokeCurrent")((actor: SessionActor) =>
    transaction.run(
      Effect.gen(function* () {
        const revoked = yield* repository.auth.session.revoke(actor.session.id, actor.user.id);
        if (revoked === undefined) return;

        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "auth.session_revoked",
          targetType: "session",
          targetId: revoked.id,
          metadata: {},
        });
      }),
    ),
  );

  return { resolve, revokeCurrent } as const;
});
