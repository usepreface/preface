import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";

import type { VerificationId } from "@usepreface/protocol";
import { CreateVerification, Verification } from "@usepreface/protocol/model";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { verification } from "#/schema/auth/verification";

const makeVerificationRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(Verification);
  const pending = and(isNull(verification.consumedAt), isNull(verification.revokedAt));
  const findById = Effect.fn("VerificationRepository.findById")(function* (id: VerificationId) {
    const [row] = yield* database.select().from(verification).where(eq(verification.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const lockById = Effect.fn("VerificationRepository.lockById")(function* (id: VerificationId) {
    const active = yield* Effect.serviceOption(database.$client.transactionService);
    if (Option.isNone(active))
      return yield* Effect.die(new Error("Verification locking requires TransactionService.run"));

    const [row] = yield* database
      .select()
      .from(verification)
      .where(eq(verification.id, id))
      .for("update");
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const retirePendingBySubject = Effect.fn("VerificationRepository.retirePendingBySubject")(
    function* (subjectKey: string) {
      const rows = yield* database
        .update(verification)
        .set({ revokedAt: DateTime.toDateUtc(yield* DateTime.now) })
        .where(
          and(
            eq(verification.purpose, "email_sign_in"),
            eq(verification.subjectKey, subjectKey),
            pending,
          ),
        )
        .returning();
      return rows.map((row) => decode(row));
    },
    mapToDatabaseError,
  );
  const create = Effect.fn("VerificationRepository.create")(function* (input: CreateVerification) {
    const encoded = Schema.encodeSync(CreateVerification)(input);
    const [row] = yield* database
      .insert(verification)
      .values({
        ...encoded,
        id: input.id,
        userId: input.userId,
        userEmailId: input.userEmailId,
        emailJobId: input.emailJobId,
        createdAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .returning();
    if (row === undefined)
      return yield* Effect.die(new Error("Verification insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const recordFailure = Effect.fn("VerificationRepository.recordFailure")(function* (
    id: VerificationId,
  ) {
    const [row] = yield* database
      .update(verification)
      .set({ attempts: sql`${verification.attempts} + 1` })
      .where(
        and(
          eq(verification.id, id),
          pending,
          lt(verification.attempts, 5),
          gt(verification.expiresAt, DateTime.toDateUtc(yield* DateTime.now)),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const consume = Effect.fn("VerificationRepository.consume")(function* (id: VerificationId) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(verification)
      .set({ consumedAt: now })
      .where(
        and(
          eq(verification.id, id),
          pending,
          lt(verification.attempts, 5),
          gt(verification.expiresAt, now),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const deleteExpiredBatch = Effect.fn("VerificationRepository.deleteExpiredBatch")(function* () {
    const cutoff = DateTime.toDateUtc(DateTime.subtractDuration(yield* DateTime.now, "1 day"));
    const rows = yield* database
      .delete(verification)
      .where(
        sql`${verification.id} in (select id from auth.verification where expires_at <= ${cutoff} order by expires_at limit 500 for update skip locked)`,
      )
      .returning({ id: verification.id });
    return rows.length;
  }, mapToDatabaseError);
  return {
    findById,
    lockById,
    retirePendingBySubject,
    create,
    recordFailure,
    consume,
    deleteExpiredBatch,
  } as const;
});
export class VerificationRepository extends Context.Service<
  VerificationRepository,
  Effect.Success<typeof makeVerificationRepository>
>()("@usepreface/database/repositories/auth/VerificationRepository") {
  static readonly layer = Layer.effect(VerificationRepository, makeVerificationRepository);
}
