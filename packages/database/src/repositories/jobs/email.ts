import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { EmailJobId } from "@usepreface/protocol";
import {
  EmailJob,
  EnqueueEmailJob,
  type EmailJobErrorCode,
  type EmailProviderName,
} from "@usepreface/protocol/model";
import { and, asc, eq, gt, isNull, lt, lte, or, sql } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { TransactionService } from "#/core/transaction";
import { emailJob } from "#/schema/jobs/email";

const makeEmailJobRepository = Effect.gen(function* () {
  const database = yield* Database;
  const transaction = yield* TransactionService;
  const decode = Schema.decodeUnknownSync(EmailJob);
  const encode = Schema.encodeSync(EnqueueEmailJob);

  const findById = Effect.fn("EmailJobRepository.findById")(function* (id: EmailJobId) {
    const [row] = yield* database.select().from(emailJob).where(eq(emailJob.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const enqueue = Effect.fn("EmailJobRepository.enqueue")(function* (input: EnqueueEmailJob) {
    const encoded = encode(input);
    const [inserted] = yield* database
      .insert(emailJob)
      .values({
        ...encoded,
        createdAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .onConflictDoNothing({ target: emailJob.idempotencyKey })
      .returning();

    if (inserted !== undefined) return { job: decode(inserted), inserted: true } as const;
    const [existing] = yield* database
      .select()
      .from(emailJob)
      .where(eq(emailJob.idempotencyKey, input.idempotencyKey));
    if (existing === undefined)
      return yield* Effect.die(new Error("Conflicting email job disappeared"));
    return { job: decode(existing), inserted: false } as const;
  }, mapToDatabaseError);

  const claim = Effect.fn("EmailJobRepository.claim")(
    (input: {
      readonly leaseToken: string;
      readonly leaseExpiresAt: DateTime.Utc;
      readonly maximumAttempts: number;
      readonly provider: EmailProviderName;
      readonly supportsIdempotency: boolean;
      readonly replayAfter: DateTime.Utc;
    }) =>
      transaction.run(
        Effect.gen(function* () {
          const now = DateTime.toDateUtc(yield* DateTime.now);
          const inactive = or(
            eq(emailJob.status, "pending"),
            and(eq(emailJob.status, "processing"), lte(emailJob.leaseExpiresAt, now)),
          );

          // Never clear an active worker's lease; its result may still be in flight.
          yield* database
            .update(emailJob)
            .set({
              status: "expired",
              encryptedPayload: null,
              leaseToken: null,
              leaseExpiresAt: null,
            })
            .where(and(inactive, lte(emailJob.expiresAt, now)));
          yield* database
            .update(emailJob)
            .set({
              status: "failed",
              encryptedPayload: null,
              leaseToken: null,
              leaseExpiresAt: null,
              lastErrorCode: "ATTEMPTS_EXHAUSTED",
            })
            .where(and(inactive, sql`${emailJob.attempts} >= ${input.maximumAttempts}`));
          if (!input.supportsIdempotency) {
            // A crashed sender may already have been accepted; do not blindly send it again.
            yield* database
              .update(emailJob)
              .set({
                status: "failed",
                encryptedPayload: null,
                leaseToken: null,
                leaseExpiresAt: null,
                lastErrorCode: "UNKNOWN_OUTCOME",
              })
              .where(
                and(
                  eq(emailJob.status, "processing"),
                  eq(emailJob.provider, input.provider),
                  lte(emailJob.leaseExpiresAt, now),
                ),
              );
          }
          // Provider deduplication has finite retention; old uncertain work is terminal.
          yield* database
            .update(emailJob)
            .set({
              status: "failed",
              encryptedPayload: null,
              leaseToken: null,
              leaseExpiresAt: null,
              lastErrorCode: "UNKNOWN_OUTCOME",
            })
            .where(
              and(
                inactive,
                gt(emailJob.attempts, 0),
                or(
                  and(
                    eq(emailJob.status, "pending"),
                    lte(emailJob.availableAt, DateTime.toDateUtc(input.replayAfter)),
                  ),
                  and(
                    eq(emailJob.status, "processing"),
                    lte(emailJob.leaseExpiresAt, DateTime.toDateUtc(input.replayAfter)),
                  ),
                ),
              ),
            );

          const [candidate] = yield* database
            .select()
            .from(emailJob)
            .where(
              and(
                inactive,
                lte(emailJob.availableAt, now),
                gt(emailJob.expiresAt, now),
                lt(emailJob.attempts, input.maximumAttempts),
                or(isNull(emailJob.provider), eq(emailJob.provider, input.provider)),
              ),
            )
            .orderBy(asc(emailJob.availableAt), asc(emailJob.id))
            .limit(1)
            .for("update", { skipLocked: true });
          if (candidate === undefined) return undefined;

          const [claimed] = yield* database
            .update(emailJob)
            .set({
              status: "processing",
              provider: input.provider,
              attempts: sql`${emailJob.attempts} + 1`,
              leaseToken: input.leaseToken,
              leaseExpiresAt: DateTime.toDateUtc(input.leaseExpiresAt),
            })
            .where(eq(emailJob.id, candidate.id))
            .returning();
          return claimed === undefined ? undefined : decode(claimed);
        }),
      ),
    mapToDatabaseError,
  );

  const finish = Effect.fn("EmailJobRepository.finish")(function* (input: {
    readonly id: EmailJobId;
    readonly leaseToken: string;
    readonly status: "sent" | "failed" | "expired";
    readonly lastErrorCode?: EmailJobErrorCode;
    readonly providerMessageId?: string;
  }) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(emailJob)
      .set({
        status: input.status,
        encryptedPayload: null,
        leaseToken: null,
        leaseExpiresAt: null,
        lastErrorCode: input.lastErrorCode ?? null,
        providerMessageId: input.providerMessageId ?? null,
        sentAt: input.status === "sent" ? now : null,
      })
      .where(
        and(
          eq(emailJob.id, input.id),
          eq(emailJob.status, "processing"),
          eq(emailJob.leaseToken, input.leaseToken),
          gt(emailJob.leaseExpiresAt, now),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const reschedule = Effect.fn("EmailJobRepository.reschedule")(function* (input: {
    readonly id: EmailJobId;
    readonly leaseToken: string;
    readonly availableAt: DateTime.Utc;
    readonly lastErrorCode: EmailJobErrorCode;
  }) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .update(emailJob)
      .set({
        status: "pending",
        availableAt: DateTime.toDateUtc(input.availableAt),
        leaseToken: null,
        leaseExpiresAt: null,
        lastErrorCode: input.lastErrorCode,
      })
      .where(
        and(
          eq(emailJob.id, input.id),
          eq(emailJob.status, "processing"),
          eq(emailJob.leaseToken, input.leaseToken),
          gt(emailJob.leaseExpiresAt, now),
          gt(emailJob.expiresAt, DateTime.toDateUtc(input.availableAt)),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const cancel = Effect.fn("EmailJobRepository.cancel")(function* (id: EmailJobId) {
    const [row] = yield* database
      .update(emailJob)
      .set({ status: "cancelled", encryptedPayload: null, leaseToken: null, leaseExpiresAt: null })
      .where(
        and(
          eq(emailJob.id, id),
          or(eq(emailJob.status, "pending"), eq(emailJob.status, "processing")),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  return { enqueue, findById, claim, finish, reschedule, cancel } as const;
});

export class EmailJobRepository extends Context.Service<
  EmailJobRepository,
  Effect.Success<typeof makeEmailJobRepository>
>()("@usepreface/database/repositories/jobs/EmailJobRepository") {
  static readonly layer = Layer.effect(EmailJobRepository, makeEmailJobRepository);
}
