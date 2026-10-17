import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { BootstrapChallengeId } from "@usepreface/protocol";
import { BootstrapChallenge, CreateBootstrapChallenge } from "@usepreface/protocol/model";
import { and, eq, gt, lt, sql } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { bootstrapChallenge } from "#/schema/instance/bootstrap-challenge";

const makeBootstrapChallengeRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(BootstrapChallenge);
  const encode = Schema.encodeSync(CreateBootstrapChallenge);

  const find = Effect.fn("BootstrapChallengeRepository.find")(function* () {
    const [row] = yield* database
      .select()
      .from(bootstrapChallenge)
      .where(eq(bootstrapChallenge.installationId, 1));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const replace = Effect.fn("BootstrapChallengeRepository.replace")(function* (
    input: CreateBootstrapChallenge,
  ) {
    const values = {
      ...encode(input),
      id: input.id,
      emailJobId: input.emailJobId,
      createdAt: DateTime.toDateUtc(yield* DateTime.now),
      attempts: 0,
    };
    const [row] = yield* database
      .insert(bootstrapChallenge)
      .values(values)
      .onConflictDoUpdate({ target: bootstrapChallenge.installationId, set: values })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Bootstrap challenge insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);

  const recordFailure = Effect.fn("BootstrapChallengeRepository.recordFailure")(function* (
    id: BootstrapChallengeId,
  ) {
    const [row] = yield* database
      .update(bootstrapChallenge)
      .set({ attempts: sql`${bootstrapChallenge.attempts} + 1` })
      .where(
        and(
          eq(bootstrapChallenge.id, id),
          lt(bootstrapChallenge.attempts, 5),
          gt(bootstrapChallenge.expiresAt, DateTime.toDateUtc(yield* DateTime.now)),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const consume = Effect.fn("BootstrapChallengeRepository.consume")(function* (
    id: BootstrapChallengeId,
  ) {
    const [row] = yield* database
      .delete(bootstrapChallenge)
      .where(
        and(
          eq(bootstrapChallenge.id, id),
          lt(bootstrapChallenge.attempts, 5),
          gt(bootstrapChallenge.expiresAt, DateTime.toDateUtc(yield* DateTime.now)),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const clear = Effect.fn("BootstrapChallengeRepository.clear")(function* () {
    yield* database.delete(bootstrapChallenge).where(eq(bootstrapChallenge.installationId, 1));
  }, mapToDatabaseError);

  return { find, replace, recordFailure, consume, clear } as const;
});

export class BootstrapChallengeRepository extends Context.Service<
  BootstrapChallengeRepository,
  Effect.Success<typeof makeBootstrapChallengeRepository>
>()("@usepreface/database/repositories/instance/BootstrapChallengeRepository") {
  static readonly layer = Layer.effect(
    BootstrapChallengeRepository,
    makeBootstrapChallengeRepository,
  );
}
