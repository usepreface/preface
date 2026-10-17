import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { AccountId, IdentityConnectionId, SessionId, UserId } from "@usepreface/protocol";
import { CreateSessionAuthentication, SessionAuthentication } from "@usepreface/protocol/model";
import { and, eq, gt, isNotNull, isNull, or, inArray } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { account } from "#/schema/auth/account";
import { identityConnection } from "#/schema/auth/identity-connection";
import { sessionAuthentication } from "#/schema/auth/session-authentication";
import { userEmail } from "#/schema/auth/user-email";
import { organizationMember } from "#/schema/organization/member";
import { organization } from "#/schema/organization/organization";

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
        accountId: input.method === "google" || input.method === "oidc" ? input.accountId : null,
        connectionRevision:
          input.method === "google" || input.method === "oidc" ? input.connectionRevision : null,
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
        .leftJoin(userEmail, eq(userEmail.id, sessionAuthentication.userEmailId))
        .leftJoin(account, eq(account.id, sessionAuthentication.accountId))
        .leftJoin(identityConnection, eq(identityConnection.id, account.identityConnectionId))
        .leftJoin(organization, eq(organization.id, identityConnection.organizationId))
        .leftJoin(
          organizationMember,
          and(
            eq(organizationMember.organizationId, identityConnection.organizationId),
            eq(organizationMember.userId, sessionAuthentication.userId),
          ),
        )
        .where(
          and(
            eq(sessionAuthentication.sessionId, sessionId),
            isNull(sessionAuthentication.revokedAt),
            gt(sessionAuthentication.expiresAt, DateTime.toDateUtc(yield* DateTime.now)),
            or(
              and(
                isNotNull(userEmail.id),
                isNull(userEmail.removedAt),
                isNotNull(userEmail.verifiedAt),
                eq(userEmail.loginEnabled, true),
              ),
              and(
                inArray(sessionAuthentication.method, ["google", "oidc"]),
                eq(identityConnection.provider, sessionAuthentication.method),
                or(
                  eq(sessionAuthentication.method, "google"),
                  and(
                    isNotNull(organization.id),
                    isNull(organization.archivedAt),
                    isNotNull(organizationMember.id),
                    isNull(organizationMember.suspendedAt),
                    isNull(organizationMember.removedAt),
                  ),
                ),
                isNotNull(account.id),
                isNull(account.unlinkedAt),
                eq(identityConnection.status, "active"),
                eq(identityConnection.revision, sessionAuthentication.connectionRevision),
              ),
            ),
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
  const revokeByAccount = Effect.fn("SessionAuthenticationRepository.revokeByAccount")(function* (
    id: AccountId,
  ) {
    yield* database
      .update(sessionAuthentication)
      .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
      .where(and(eq(sessionAuthentication.accountId, id), isNull(sessionAuthentication.revokedAt)));
  }, mapToDatabaseError);
  const revokeByConnection = Effect.fn("SessionAuthenticationRepository.revokeByConnection")(
    function* (id: IdentityConnectionId) {
      const accounts = database
        .select({ id: account.id })
        .from(account)
        .where(eq(account.identityConnectionId, id));
      yield* database
        .update(sessionAuthentication)
        .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
        .where(
          and(
            inArray(sessionAuthentication.accountId, accounts),
            isNull(sessionAuthentication.revokedAt),
          ),
        );
    },
    mapToDatabaseError,
  );
  return {
    create,
    listUsableBySessionId,
    revokeBySessionId,
    revokeByAccount,
    revokeByConnection,
  } as const;
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
