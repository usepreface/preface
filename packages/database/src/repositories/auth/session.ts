import { Context, DateTime, Duration, Effect, Layer, Schema } from "effect";

import type { SessionId, UserId } from "@usepreface/protocol";
import { CreateSession, Session } from "@usepreface/protocol/model";
import { and, desc, eq, exists, gt, isNotNull, isNull, lt, sql } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { session } from "#/schema/auth/session";
import { sessionAuthentication } from "#/schema/auth/session-authentication";
import { userEmail } from "#/schema/auth/user-email";

const makeSessionRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeSync(Session);
  const encode = Schema.encodeSync(CreateSession);

  const create = Effect.fn("SessionRepository.create")(function* (input: CreateSession) {
    const encoded = encode(input);
    const now = DateTime.toDateUtc(yield* DateTime.now);

    const [row] = yield* database
      .insert(session)
      .values({ ...encoded, userId: input.userId, createdAt: now, lastSeenAt: now })
      .returning();

    if (row === undefined) return yield* Effect.die(new Error("Session insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);

  const findActiveByTokenHash = Effect.fn("SessionRepository.findActiveByTokenHash")(function* (
    tokenHash: Session["tokenHash"],
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .select()
      .from(session)
      .where(
        and(
          eq(session.tokenHash, tokenHash),
          isNull(session.revokedAt),
          gt(session.expiresAt, now),
        ),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const recordActivity = Effect.fn("SessionRepository.recordActivity")(function* (
    sessionId: SessionId,
    idleTimeout?: Duration.Duration,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(session)
      .set({
        // Requests may arrive out of order; activity must never move backwards.
        lastSeenAt: sql`greatest(${session.lastSeenAt}, ${sql.param(now, session.lastSeenAt)})`,
      })
      .where(
        and(
          eq(session.id, sessionId),
          isNull(session.revokedAt),
          gt(session.expiresAt, now),
          idleTimeout === undefined
            ? undefined
            : gt(session.lastSeenAt, new Date(now.getTime() - Duration.toMillis(idleTimeout))),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const revoke = Effect.fn("SessionRepository.revoke")(function* (
    sessionId: SessionId,
    userId: UserId,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(session)
      .set({ revokedAt: now })
      .where(and(eq(session.id, sessionId), eq(session.userId, userId), isNull(session.revokedAt)))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const listActiveByUserId = Effect.fn("SessionRepository.listActiveByUserId")(function* (input: {
    readonly userId: UserId;
    readonly cursor?: SessionId;
    readonly limit: number;
    readonly idleTimeout: Duration.Duration;
  }) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const evidence = database
      .select({ id: sessionAuthentication.id })
      .from(sessionAuthentication)
      .innerJoin(userEmail, eq(userEmail.id, sessionAuthentication.userEmailId))
      .where(
        and(
          eq(sessionAuthentication.sessionId, session.id),
          isNull(sessionAuthentication.revokedAt),
          gt(sessionAuthentication.expiresAt, now),
          isNull(userEmail.removedAt),
          isNotNull(userEmail.verifiedAt),
          eq(userEmail.loginEnabled, true),
        ),
      );
    const rows = yield* database
      .select()
      .from(session)
      .where(
        and(
          eq(session.userId, input.userId),
          isNull(session.revokedAt),
          gt(session.expiresAt, now),
          gt(session.lastSeenAt, new Date(now.getTime() - Duration.toMillis(input.idleTimeout))),
          exists(evidence),
          input.cursor === undefined ? undefined : lt(session.id, input.cursor),
        ),
      )
      .orderBy(desc(session.id))
      .limit(input.limit);
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);
  const revokeAllByUserId = Effect.fn("SessionRepository.revokeAllByUserId")(function* (
    userId: UserId,
  ) {
    const rows = yield* database
      .update(session)
      .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
      .where(and(eq(session.userId, userId), isNull(session.revokedAt)))
      .returning();
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);
  return {
    create,
    findActiveByTokenHash,
    recordActivity,
    revoke,
    listActiveByUserId,
    revokeAllByUserId,
  } as const;
});

export class SessionRepository extends Context.Service<
  SessionRepository,
  Effect.Success<typeof makeSessionRepository>
>()("@usepreface/database/repositories/auth/SessionRepository") {
  static readonly layer = Layer.effect(SessionRepository, makeSessionRepository);
}
