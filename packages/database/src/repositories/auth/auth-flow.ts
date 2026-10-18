import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { AuthFlowId, IdentityConnectionId, SessionId, UserId } from "@usepreface/protocol";
import { CreateAuthFlow, AuthFlow } from "@usepreface/protocol/model";
import { and, eq, isNull, gt, sql } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { authFlow as table } from "#/schema/auth/auth-flow";
const makeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(AuthFlow);
  const create = Effect.fn("AuthFlowRepository.create")(function* (input: CreateAuthFlow) {
    const [row] = yield* database
      .insert(table)
      .values({
        ...Schema.encodeSync(CreateAuthFlow)(input),
        provider: input.provider ?? "google",
        signingKeyId: input.signingKeyId ?? null,
        connectionOrganizationId:
          input.provider === "oidc" || input.provider === "saml"
            ? input.targetOrganizationId
            : null,
        invitationId: input.invitationId ?? null,
        id: input.id,
        identityConnectionId: input.identityConnectionId,
        initiatingSessionId: input.initiatingSessionId,
        expectedUserId: input.expectedUserId,
        targetOrganizationId: input.targetOrganizationId,
        createdAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Flow insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const findById = Effect.fn("AuthFlowRepository.findById")(function* (id: AuthFlowId) {
    const [row] = yield* database.select().from(table).where(eq(table.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const stageVerifiedIdentity = Effect.fn("AuthFlowRepository.stageVerifiedIdentity")(function* (
    id: AuthFlowId,
    ciphertext: string,
  ) {
    const [row] = yield* database
      .update(table)
      .set({
        verifiedIdentityCiphertext: ciphertext,
        verifiedAt: DateTime.toDateUtc(yield* DateTime.now),
        pkceVerifierCiphertext: null,
      })
      .where(
        and(
          eq(table.id, id),
          sql`${table.claimedAt} is not null`,
          isNull(table.verifiedIdentityCiphertext),
          isNull(table.consumedAt),
          isNull(table.revokedAt),
          gt(table.expiresAt, DateTime.toDateUtc(yield* DateTime.now)),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const lockById = Effect.fn("AuthFlowRepository.lockById")(function* (id: AuthFlowId) {
    const [row] = yield* database.select().from(table).where(eq(table.id, id)).for("update");
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const verifyEmail = Effect.fn("AuthFlowRepository.verifyEmail")(function* (id: AuthFlowId) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(table)
      .set({ emailVerifiedAt: now })
      .where(
        and(
          eq(table.id, id),
          isNull(table.consumedAt),
          isNull(table.revokedAt),
          gt(table.expiresAt, now),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findByStateHash = Effect.fn("AuthFlowRepository.findByStateHash")(function* (hash: string) {
    const [row] = yield* database.select().from(table).where(eq(table.stateHash, hash));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const claim = Effect.fn("AuthFlowRepository.claim")(function* (id: AuthFlowId) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(table)
      .set({ claimedAt: now })
      .where(
        and(
          eq(table.id, id),
          isNull(table.claimedAt),
          isNull(table.consumedAt),
          isNull(table.revokedAt),
          gt(table.expiresAt, now),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const consume = Effect.fn("AuthFlowRepository.consume")(function* (id: AuthFlowId) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(table)
      .set({ consumedAt: now, pkceVerifierCiphertext: null, verifiedIdentityCiphertext: null })
      .where(
        and(
          eq(table.id, id),
          sql`${table.claimedAt} is not null`,
          isNull(table.consumedAt),
          isNull(table.revokedAt),
          gt(table.expiresAt, now),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const revoke = Effect.fn("AuthFlowRepository.revoke")(function* (id: AuthFlowId) {
    yield* database
      .update(table)
      .set({
        revokedAt: DateTime.toDateUtc(yield* DateTime.now),
        pkceVerifierCiphertext: null,
        verifiedIdentityCiphertext: null,
      })
      .where(and(eq(table.id, id), isNull(table.consumedAt), isNull(table.revokedAt)));
  }, mapToDatabaseError);
  const revokeByConnection = Effect.fn("AuthFlowRepository.revokeByConnection")(function* (
    id: IdentityConnectionId,
  ) {
    yield* database
      .update(table)
      .set({
        revokedAt: DateTime.toDateUtc(yield* DateTime.now),
        pkceVerifierCiphertext: null,
        verifiedIdentityCiphertext: null,
      })
      .where(
        and(eq(table.identityConnectionId, id), isNull(table.consumedAt), isNull(table.revokedAt)),
      );
  }, mapToDatabaseError);
  const revokeBySession = Effect.fn("AuthFlowRepository.revokeBySession")(function* (
    id: SessionId,
  ) {
    yield* database
      .update(table)
      .set({
        revokedAt: DateTime.toDateUtc(yield* DateTime.now),
        pkceVerifierCiphertext: null,
        verifiedIdentityCiphertext: null,
      })
      .where(
        and(eq(table.initiatingSessionId, id), isNull(table.consumedAt), isNull(table.revokedAt)),
      );
  }, mapToDatabaseError);
  const revokeByUser = Effect.fn("AuthFlowRepository.revokeByUser")(function* (id: UserId) {
    yield* database
      .update(table)
      .set({
        revokedAt: DateTime.toDateUtc(yield* DateTime.now),
        pkceVerifierCiphertext: null,
        verifiedIdentityCiphertext: null,
      })
      .where(and(eq(table.expectedUserId, id), isNull(table.consumedAt), isNull(table.revokedAt)));
  }, mapToDatabaseError);
  const deleteExpiredBatch = Effect.fn("AuthFlowRepository.deleteExpiredBatch")(function* () {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const scrubbed =
      yield* database.$client`update auth.auth_flow set pkce_verifier_ciphertext = null, verified_identity_ciphertext = null where id in (select id from auth.auth_flow where expires_at <= ${now} and (pkce_verifier_ciphertext is not null or verified_identity_ciphertext is not null) limit 500 for update skip locked) returning id`;
    const cutoff = DateTime.toDateUtc(DateTime.subtractDuration(yield* DateTime.now, "1 day"));
    const deleted =
      yield* database.$client`delete from auth.auth_flow where id in (select id from auth.auth_flow where expires_at <= ${cutoff} limit 500 for update skip locked) returning id`;
    return Math.max(scrubbed.length, deleted.length);
  }, mapToDatabaseError);
  return {
    create,
    findById,
    stageVerifiedIdentity,
    lockById,
    verifyEmail,
    findByStateHash,
    claim,
    consume,
    revoke,
    revokeByConnection,
    revokeBySession,
    revokeByUser,
    deleteExpiredBatch,
  };
});
export class AuthFlowRepository extends Context.Service<
  AuthFlowRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/AuthFlowRepository") {
  static readonly layer = Layer.effect(AuthFlowRepository, makeRepository);
}
