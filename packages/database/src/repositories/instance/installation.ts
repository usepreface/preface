import { Context, DateTime, Effect, Layer, Schema } from "effect";

import { InstanceStateError } from "@usepreface/protocol";
import { Installation, IssueBootstrapToken } from "@usepreface/protocol/model";
import { and, eq, exists, gt, isNull, lte } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { TransactionService } from "#/core/transaction";
import { lockInstallation } from "#/repositories/instance/installation-lock";
import { installation } from "#/schema/instance/installation";
import { instanceOwner } from "#/schema/instance/owner";

const makeInstallationRepository = Effect.gen(function* () {
  const database = yield* Database;
  const transaction = yield* TransactionService;
  const decode = Schema.decodeSync(Installation);

  const find = Effect.fn("InstallationRepository.find")(function* () {
    const [row] = yield* database.select().from(installation).where(eq(installation.id, 1));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const initialize = Effect.fn("InstallationRepository.initialize")(function* () {
    const [inserted] = yield* database
      .insert(installation)
      .values({ id: 1 })
      .onConflictDoNothing({ target: installation.id })
      .returning();
    if (inserted !== undefined) return { installation: decode(inserted), created: true };
    const current = yield* find();
    if (current === undefined) return yield* new InstanceStateError({ code: "NOT_INITIALIZED" });
    return { installation: current, created: false };
  }, mapToDatabaseError);

  const issueBootstrapToken = Effect.fn("InstallationRepository.issueBootstrapToken")(function* (
    input: IssueBootstrapToken,
  ) {
    const encoded = Schema.encodeSync(IssueBootstrapToken)(input);
    const now = yield* DateTime.now;
    if (encoded.expiresAt.getTime() <= DateTime.toEpochMillis(now)) {
      return yield* new InstanceStateError({ code: "INVALID_BOOTSTRAP_EXPIRY" });
    }
    const [row] = yield* database
      .update(installation)
      .set({
        bootstrapTokenHash: encoded.hash,
        bootstrapTokenIssuedAt: DateTime.toDateUtc(now),
        bootstrapTokenExpiresAt: encoded.expiresAt,
      })
      .where(and(eq(installation.id, 1), isNull(installation.bootstrapCompletedAt)))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const completeBootstrap = Effect.fn("InstallationRepository.completeBootstrap")(
    (tokenHash: string) =>
      transaction.run(
        Effect.gen(function* () {
          yield* lockInstallation(database);
          const now = DateTime.toDateUtc(yield* DateTime.now);
          const [row] = yield* database
            .update(installation)
            .set({
              bootstrapCompletedAt: now,
              bootstrapTokenHash: null,
              bootstrapTokenIssuedAt: null,
              bootstrapTokenExpiresAt: null,
            })
            .where(
              and(
                eq(installation.id, 1),
                isNull(installation.bootstrapCompletedAt),
                eq(installation.bootstrapTokenHash, tokenHash),
                lte(installation.bootstrapTokenIssuedAt, now),
                gt(installation.bootstrapTokenExpiresAt, now),
                exists(
                  database
                    .select({ id: instanceOwner.id })
                    .from(instanceOwner)
                    .where(isNull(instanceOwner.revokedAt)),
                ),
              ),
            )
            .returning();
          return row === undefined ? undefined : decode(row);
        }),
      ),
  );

  return {
    find,
    initialize,
    issueBootstrapToken,
    completeBootstrap,
    lock: Effect.fn("InstallationRepository.lock")(
      () => lockInstallation(database),
      mapToDatabaseError,
    ),
  };
});

export class InstallationRepository extends Context.Service<
  InstallationRepository,
  Effect.Success<typeof makeInstallationRepository>
>()("@usepreface/database/repositories/instance/InstallationRepository") {
  static readonly layer = Layer.effect(InstallationRepository, makeInstallationRepository);
}
