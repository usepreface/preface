import type { Redacted } from "effect";
import { DateTime, Duration, Effect } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { AuthenticationError, type SessionId } from "@usepreface/protocol";
import type { ListSessionsQuery, SessionList, SessionActor } from "@usepreface/protocol/dto";

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

    const user = yield* repository.auth.user.findProfileById(session.userId);
    const now = DateTime.toEpochMillis(yield* DateTime.now);
    const inactiveFor = now - DateTime.toEpochMillis(session.lastSeenAt);
    if (
      user === undefined ||
      user.disabledAt !== null ||
      inactiveFor >= Duration.toMillis(sessionIdleTimeout) ||
      (yield* repository.auth.sessionAuthentication.listUsableBySessionId(session.id)).length === 0
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
        metadata: user.metadata,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      session: { id: session.id, expiresAt: session.expiresAt },
    };
    return actor;
  });

  // actor comes from resolve(), never from caller-controlled body identities.
  const revoke = Effect.fn("Application.auth.session.revoke")(
    (actor: SessionActor, sessionId: SessionId) =>
      transaction.run(
        Effect.gen(function* () {
          const revoked = yield* repository.auth.session.revoke(sessionId, actor.user.id);
          if (revoked === undefined) return;

          yield* repository.auth.sessionAuthentication.revokeBySessionId(revoked.id, actor.user.id);
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

  const list = Effect.fn("Application.auth.session.list")(function* (
    actor: SessionActor,
    input: ListSessionsQuery,
  ) {
    const limit = input.limit ?? 25;
    const rows = yield* repository.auth.session.listActiveByUserId({
      userId: actor.user.id,
      ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
      limit: limit + 1,
      idleTimeout: sessionIdleTimeout,
    });
    const visible = rows.slice(0, limit);
    return {
      sessions: visible.map((session) => ({
        id: session.id,
        createdAt: session.createdAt,
        lastSeenAt: session.lastSeenAt,
        expiresAt: session.expiresAt,
        isCurrent: session.id === actor.session.id,
      })),
      nextCursor: rows.length > limit ? (visible.at(-1)?.id ?? null) : null,
    } satisfies SessionList;
  });
  const revokeCurrent = Effect.fn("Application.auth.session.revokeCurrent")((actor: SessionActor) =>
    revoke(actor, actor.session.id),
  );
  const revokeAll = Effect.fn("Application.auth.session.revokeAll")(function* (
    actor: SessionActor,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.auth.user.lockById(actor.user.id);
        const sessions = yield* repository.auth.session.revokeAllByUserId(actor.user.id);
        for (const session of sessions) {
          yield* repository.auth.sessionAuthentication.revokeBySessionId(session.id, actor.user.id);
          yield* repository.audit.event.append({
            actorKind: "user",
            actorUserId: actor.user.id,
            eventType: "auth.session_revoked",
            targetType: "session",
            targetId: session.id,
            metadata: {},
          });
        }
      }),
    );
  });
  return { resolve, revokeCurrent, list, revoke, revokeAll } as const;
});
