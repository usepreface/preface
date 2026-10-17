import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type {
  OrganizationAuthRecoveryTokenId,
  OrganizationId,
  OrganizationMemberId,
} from "@usepreface/protocol";
import { OrganizationAuthRecoveryToken } from "@usepreface/protocol/model";
import { and, eq, isNull } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { organizationAuthRecoveryToken as table } from "#/schema/organization/auth-recovery-token";

const makeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(OrganizationAuthRecoveryToken);
  const findActiveByMember = Effect.fn(
    "OrganizationAuthRecoveryTokenRepository.findActiveByMember",
  )(function* (organizationId: OrganizationId, memberId: OrganizationMemberId) {
    const [row] = yield* database
      .select()
      .from(table)
      .where(
        and(
          eq(table.organizationId, organizationId),
          eq(table.memberId, memberId),
          isNull(table.consumedAt),
          isNull(table.revokedAt),
        ),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const create = Effect.fn("OrganizationAuthRecoveryTokenRepository.create")(function* (
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    tokenHash: string,
  ) {
    const [row] = yield* database
      .insert(table)
      .values({
        organizationId,
        memberId,
        tokenHash,
        createdAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Recovery credential insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const consume = Effect.fn("OrganizationAuthRecoveryTokenRepository.consume")(function* (
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    id: OrganizationAuthRecoveryTokenId,
  ) {
    const [row] = yield* database
      .update(table)
      .set({ consumedAt: DateTime.toDateUtc(yield* DateTime.now) })
      .where(
        and(
          eq(table.organizationId, organizationId),
          eq(table.memberId, memberId),
          eq(table.id, id),
          isNull(table.consumedAt),
          isNull(table.revokedAt),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const revokeByMember = Effect.fn("OrganizationAuthRecoveryTokenRepository.revokeByMember")(
    function* (organizationId: OrganizationId, memberId: OrganizationMemberId) {
      const rows = yield* database
        .update(table)
        .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
        .where(
          and(
            eq(table.organizationId, organizationId),
            eq(table.memberId, memberId),
            isNull(table.consumedAt),
            isNull(table.revokedAt),
          ),
        )
        .returning();
      return rows.map((row) => decode(row));
    },
    mapToDatabaseError,
  );
  return { findActiveByMember, create, consume, revokeByMember } as const;
});
export class OrganizationAuthRecoveryTokenRepository extends Context.Service<
  OrganizationAuthRecoveryTokenRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/repositories/organization/OrganizationAuthRecoveryTokenRepository") {
  static readonly layer = Layer.effect(OrganizationAuthRecoveryTokenRepository, makeRepository);
}
