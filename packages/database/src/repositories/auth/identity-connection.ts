import { Context, Effect, Layer, Option, Schema } from "effect";

import type { IdentityConnectionId } from "@usepreface/protocol";
import { IdentityConnection } from "@usepreface/protocol/model";
import { and, eq } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { identityConnection as table } from "#/schema/auth/identity-connection";
const makeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(IdentityConnection);
  const findGoogle = Effect.fn("IdentityConnectionRepository.findGoogle")(function* () {
    const [row] = yield* database.select().from(table).where(eq(table.provider, "google"));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findById = Effect.fn("IdentityConnectionRepository.findById")(function* (
    id: IdentityConnectionId,
  ) {
    const [row] = yield* database.select().from(table).where(eq(table.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const lockById = Effect.fn("IdentityConnectionRepository.lockById")(function* (
    id: IdentityConnectionId,
  ) {
    if (Option.isNone(yield* Effect.serviceOption(database.$client.transactionService)))
      return yield* Effect.die(new Error("Connection locking requires TransactionService.run"));
    const [row] = yield* database.select().from(table).where(eq(table.id, id)).for("update");
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const createGoogle = Effect.fn("IdentityConnectionRepository.createGoogle")(function* (
    input: IdentityConnection,
  ) {
    const [row] = yield* database
      .insert(table)
      .values({ ...Schema.encodeSync(IdentityConnection)(input), id: input.id })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Connection insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const update = Effect.fn("IdentityConnectionRepository.update")(function* (
    input: IdentityConnection,
    expectedRevision: number,
  ) {
    const [row] = yield* database
      .update(table)
      .set({ ...Schema.encodeSync(IdentityConnection)(input), id: input.id })
      .where(and(eq(table.id, input.id), eq(table.revision, expectedRevision)))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return { findGoogle, findById, lockById, createGoogle, update };
});
export class IdentityConnectionRepository extends Context.Service<
  IdentityConnectionRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/IdentityConnectionRepository") {
  static readonly layer = Layer.effect(IdentityConnectionRepository, makeRepository);
}
