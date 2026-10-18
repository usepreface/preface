import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { IdentityConnectionId, IdentityConnectionKeyId } from "@usepreface/protocol";
import { IdentityConnectionKey } from "@usepreface/protocol/model";
import { eq, desc } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { identityConnectionKey as table } from "#/schema/auth/identity-connection-key";

const makeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(IdentityConnectionKey);

  const list = Effect.fn("IdentityConnectionKeyRepository.list")(function* (
    id: IdentityConnectionId,
  ) {
    const rows = yield* database
      .select()
      .from(table)
      .where(eq(table.identityConnectionId, id))
      .orderBy(desc(table.createdAt))
      .limit(50);
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);

  const find = Effect.fn("IdentityConnectionKeyRepository.find")(function* (
    id: IdentityConnectionKeyId,
    lock = false,
  ) {
    const query = database.select().from(table).where(eq(table.id, id));
    const [row] = yield* lock ? query.for("update") : query;
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const create = Effect.fn("IdentityConnectionKeyRepository.create")(function* (
    input: IdentityConnectionKey,
  ) {
    const [row] = yield* database
      .insert(table)
      .values({
        ...Schema.encodeSync(IdentityConnectionKey)(input),
        id: input.id,
        identityConnectionId: input.identityConnectionId,
        organizationId: input.organizationId,
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Connection key insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);

  const update = Effect.fn("IdentityConnectionKeyRepository.update")(function* (
    input: IdentityConnectionKey,
  ) {
    const [row] = yield* database
      .update(table)
      .set({
        ...Schema.encodeSync(IdentityConnectionKey)(input),
        id: input.id,
        identityConnectionId: input.identityConnectionId,
        organizationId: input.organizationId,
      })
      .where(eq(table.id, input.id))
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Connection key update returned no row"));
    return decode(row);
  }, mapToDatabaseError);

  const expirePending = Effect.fn("IdentityConnectionKeyRepository.expirePending")(function* () {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const cutoff = DateTime.toDateUtc(DateTime.subtractDuration(yield* DateTime.now, "7 days"));
    // Bounded work and row locks keep concurrent maintenance workers from sharing a batch.
    const rows = yield* database.$client`
      update auth.identity_connection_key
      set status = 'retired', retired_at = ${now}, private_key_ciphertext = null
      where id in (
        select k.id from auth.identity_connection_key k
        join auth.identity_connection c on c.id = k.identity_connection_id
        where k.status = 'pending'
          and (k.expires_at <= ${now} or k.created_at <= ${cutoff} or k.connection_revision <> c.revision)
        limit 100 for update of k skip locked
      )
      returning id
    `;
    return rows.length;
  }, mapToDatabaseError);

  return { list, find, create, update, expirePending };
});

export class IdentityConnectionKeyRepository extends Context.Service<
  IdentityConnectionKeyRepository,
  Effect.Success<typeof makeRepository>
>()("@usepreface/database/IdentityConnectionKeyRepository") {
  static readonly layer = Layer.effect(IdentityConnectionKeyRepository, makeRepository);
}
