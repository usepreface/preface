import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { AccountId, IdentityConnectionId, UserId } from "@usepreface/protocol";
import { Account } from "@usepreface/protocol/model";
import { and, eq, isNull } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { account as table } from "#/schema/auth/account";
const makeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(Account);
  const findById = Effect.fn("AccountRepository.findById")(function* (id: AccountId) {
    const [row] = yield* database.select().from(table).where(eq(table.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findByIdentity = Effect.fn("AccountRepository.findByIdentity")(function* (
    connectionId: IdentityConnectionId,
    subject: string,
    issuer = "https://accounts.google.com",
  ) {
    const [row] = yield* database
      .select()
      .from(table)
      .where(
        and(
          eq(table.identityConnectionId, connectionId),
          eq(table.issuer, issuer),
          eq(table.subject, subject),
        ),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const listByUserId = Effect.fn("AccountRepository.listByUserId")(function* (userId: UserId) {
    const rows = yield* database.select().from(table).where(eq(table.userId, userId));
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);
  const create = Effect.fn("AccountRepository.create")(function* (input: Account) {
    const [row] = yield* database
      .insert(table)
      .values({
        ...Schema.encodeSync(Account)(input),
        id: input.id,
        userId: input.userId,
        identityConnectionId: input.identityConnectionId,
      })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Account insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const updateUsage = Effect.fn("AccountRepository.recordUsage")(function* (
    id: AccountId,
    providerEmail: string | null,
    providerEmailVerified: boolean | null,
    relink = false,
  ) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(table)
      .set({
        providerEmail,
        providerEmailVerified,
        lastUsedAt: now,
        updatedAt: now,
        ...(relink ? { unlinkedAt: null } : {}),
      })
      .where(eq(table.id, id))
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Account update returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const unlink = Effect.fn("AccountRepository.unlink")(function* (id: AccountId, userId: UserId) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(table)
      .set({ unlinkedAt: now, updatedAt: now })
      .where(and(eq(table.id, id), eq(table.userId, userId), isNull(table.unlinkedAt)))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return { findById, findByIdentity, listByUserId, create, recordUsage: updateUsage, unlink };
});
export class AccountRepository extends Context.Service<
  AccountRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/AccountRepository") {
  static readonly layer = Layer.effect(AccountRepository, makeRepository);
}
