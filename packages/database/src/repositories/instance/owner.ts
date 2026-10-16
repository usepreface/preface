import { Context, DateTime, Effect, Layer, Schema } from "effect";

import { InstanceStateError, type UserId } from "@usepreface/protocol";
import { GrantInstanceOwner, InstanceOwner, RevokeInstanceOwner } from "@usepreface/protocol/model";
import { and, asc, eq, isNull } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { TransactionService } from "#/core/transaction";
import { lockInstallation } from "#/repositories/instance/installation-lock";
import { instanceOwner } from "#/schema/instance/owner";

const makeOwnerRepository = Effect.gen(function* () {
  const database = yield* Database;
  const transaction = yield* TransactionService;
  const decode = Schema.decodeSync(InstanceOwner);

  const findActiveByUserId = Effect.fn("InstanceOwnerRepository.findActiveByUserId")(function* (
    userId: UserId,
  ) {
    const [row] = yield* database
      .select()
      .from(instanceOwner)
      .where(and(eq(instanceOwner.userId, userId), isNull(instanceOwner.revokedAt)));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const listActive = Effect.fn("InstanceOwnerRepository.listActive")(function* () {
    const rows = yield* database
      .select()
      .from(instanceOwner)
      .where(isNull(instanceOwner.revokedAt))
      .orderBy(asc(instanceOwner.grantedAt), asc(instanceOwner.id));
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);

  const grant = Effect.fn("InstanceOwnerRepository.grant")((input: GrantInstanceOwner) =>
    transaction.run(
      Effect.gen(function* () {
        const encoded = Schema.encodeSync(GrantInstanceOwner)(input);
        const current = yield* lockInstallation(database);
        if (input.grantSource === "bootstrap" && current.bootstrapCompletedAt !== null) {
          return yield* new InstanceStateError({ code: "BOOTSTRAP_COMPLETED" });
        }
        const [row] = yield* database
          .insert(instanceOwner)
          .values({
            ...encoded,
            userId: input.userId,
            grantedByUserId: input.grantedByUserId,
            grantedAt: DateTime.toDateUtc(yield* DateTime.now),
          })
          .returning();
        if (row === undefined)
          return yield* Effect.die(new Error("Owner grant insert returned no row"));
        return decode(row);
      }),
    ),
  );

  const revoke = Effect.fn("InstanceOwnerRepository.revoke")((input: RevokeInstanceOwner) =>
    transaction.run(
      Effect.gen(function* () {
        const encoded = Schema.encodeSync(RevokeInstanceOwner)(input);
        yield* lockInstallation(database);
        const active = yield* listActive();
        if (!active.some((owner) => owner.id === input.id)) return undefined;
        if (active.length === 1) return yield* new InstanceStateError({ code: "LAST_OWNER" });

        const [row] = yield* database
          .update(instanceOwner)
          .set({
            revokedAt: DateTime.toDateUtc(yield* DateTime.now),
            revokedByUserId: input.revokedByUserId,
            revocationReason: encoded.revocationReason,
          })
          .where(and(eq(instanceOwner.id, input.id), isNull(instanceOwner.revokedAt)))
          .returning();
        return row === undefined ? undefined : decode(row);
      }),
    ),
  );

  return { findActiveByUserId, listActive, grant, revoke };
});

export class InstanceOwnerRepository extends Context.Service<
  InstanceOwnerRepository,
  Effect.Success<typeof makeOwnerRepository>
>()("@usepreface/database/repositories/instance/InstanceOwnerRepository") {
  static readonly layer = Layer.effect(InstanceOwnerRepository, makeOwnerRepository);
}
