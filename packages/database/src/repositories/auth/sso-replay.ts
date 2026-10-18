import { Context, DateTime, Effect, Layer } from "effect";

import type { IdentityConnectionId } from "@usepreface/protocol";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { ssoReplay } from "#/schema/auth/sso-replay";

const makeRepository = Effect.gen(function* () {
  const database = yield* Database;

  const reserve = Effect.fn("SsoReplayRepository.reserve")(function* (
    connectionId: IdentityConnectionId,
    kind: "response" | "assertion",
    identifierHash: string,
    expiresAt: DateTime.Utc,
  ) {
    const rows = yield* database
      .insert(ssoReplay)
      .values({
        identityConnectionId: connectionId,
        kind,
        identifierHash,
        createdAt: DateTime.toDateUtc(yield* DateTime.now),
        expiresAt: DateTime.toDateUtc(expiresAt),
      })
      .onConflictDoNothing()
      .returning({ hash: ssoReplay.identifierHash });
    return rows.length === 1;
  }, mapToDatabaseError);

  const deleteExpiredBatch = Effect.fn("SsoReplayRepository.deleteExpiredBatch")(function* () {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const rows = yield* database.$client`
      delete from auth.sso_replay
      where (identity_connection_id, kind, identifier_hash) in (
        select identity_connection_id, kind, identifier_hash from auth.sso_replay
        where expires_at <= ${now}
        limit 500 for update skip locked
      )
      returning identifier_hash
    `;
    return rows.length;
  }, mapToDatabaseError);

  return { reserve, deleteExpiredBatch };
});

export class SsoReplayRepository extends Context.Service<
  SsoReplayRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/SsoReplayRepository") {
  static readonly layer = Layer.effect(SsoReplayRepository, makeRepository);
}
