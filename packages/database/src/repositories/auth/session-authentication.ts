import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { SessionId, UserId } from "@usepreface/protocol";
import { CreateSessionAuthentication, SessionAuthentication } from "@usepreface/protocol/model";
import { and, eq, gt, isNotNull, isNull } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { sessionAuthentication } from "#/schema/auth/session-authentication";
import { userEmail } from "#/schema/auth/user-email";

const makeSessionAuthenticationRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(SessionAuthentication);
  const create = Effect.fn("SessionAuthenticationRepository.create")(function* (
    input: CreateSessionAuthentication,
  ) {
    const encoded = Schema.encodeSync(CreateSessionAuthentication)(input);
    const [row] = yield* database
      .insert(sessionAuthentication)
      .values({
        ...encoded,
        sessionId: input.sessionId,
        userId: input.userId,
        userEmailId: input.userEmailId,
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Authentication evidence insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const listUsableBySessionId = Effect.fn("SessionAuthenticationRepository.listUsableBySessionId")(
    function* (sessionId: SessionId) {
      const rows = yield* database
        .select({ evidence: sessionAuthentication })
        .from(sessionAuthentication)
        .innerJoin(userEmail, eq(userEmail.id, sessionAuthentication.userEmailId))
        .where(
          and(
            eq(sessionAuthentication.sessionId, sessionId),
            isNull(sessionAuthentication.revokedAt),
            gt(sessionAuthentication.expiresAt, DateTime.toDateUtc(yield* DateTime.now)),
            isNull(userEmail.removedAt),
            isNotNull(userEmail.verifiedAt),
            eq(userEmail.loginEnabled, true),
          ),
        );
      return rows.map((row) => decode(row.evidence));
    },
    mapToDatabaseError,
  );
  const revokeBySessionId = Effect.fn("SessionAuthenticationRepository.revokeBySessionId")(
    function* (sessionId: SessionId, userId: UserId) {
      yield* database
        .update(sessionAuthentication)
        .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
        .where(
          and(
            eq(sessionAuthentication.sessionId, sessionId),
            eq(sessionAuthentication.userId, userId),
            isNull(sessionAuthentication.revokedAt),
          ),
        );
    },
    mapToDatabaseError,
  );
  return { create, listUsableBySessionId, revokeBySessionId } as const;
});
export class SessionAuthenticationRepository extends Context.Service<
  SessionAuthenticationRepository,
  Effect.Success<typeof makeSessionAuthenticationRepository>
>()("@usepreface/database/repositories/auth/SessionAuthenticationRepository") {
  static readonly layer = Layer.effect(
    SessionAuthenticationRepository,
    makeSessionAuthenticationRepository,
  );
}
