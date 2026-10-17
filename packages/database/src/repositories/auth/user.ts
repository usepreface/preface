import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";

import { UserMetadata, type UserId } from "@usepreface/protocol";
import { CreateUser, User, UserProfile } from "@usepreface/protocol/model";
import { and, eq, isNull, getTableColumns } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { user } from "#/schema/auth/user";
import { userEmail } from "#/schema/auth/user-email";

const makeUserRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(User);

  const findById = Effect.fn("UserRepository.findById")(function* (userId: UserId) {
    const [row] = yield* database.select().from(user).where(eq(user.id, userId));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findProfileById = Effect.fn("UserRepository.findProfileById")(function* (userId: UserId) {
    const [row] = yield* database
      .select({
        ...getTableColumns(user),
        email: userEmail.email,
        emailVerifiedAt: userEmail.verifiedAt,
      })
      .from(user)
      .innerJoin(
        userEmail,
        and(
          eq(userEmail.userId, user.id),
          eq(userEmail.isPrimary, true),
          isNull(userEmail.removedAt),
        ),
      )
      .where(eq(user.id, userId));
    return row === undefined ? undefined : Schema.decodeUnknownSync(UserProfile)(row);
  }, mapToDatabaseError);
  const create = Effect.fn("UserRepository.create")(function* (input: CreateUser) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const [row] = yield* database
      .insert(user)
      .values({
        ...Schema.encodeSync(CreateUser)(input),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("User insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const lockById = Effect.fn("UserRepository.lockById")(function* (userId: UserId) {
    const active = yield* Effect.serviceOption(database.$client.transactionService);
    if (Option.isNone(active))
      return yield* Effect.die(new Error("User locking requires TransactionService.run"));

    const [row] = yield* database.select().from(user).where(eq(user.id, userId)).for("update");
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const updateMetadata = Effect.fn("UserRepository.updateMetadata")(function* (
    userId: UserId,
    metadata: UserMetadata,
  ) {
    const [row] = yield* database
      .update(user)
      .set({
        metadata: Schema.encodeSync(UserMetadata)(metadata),
        updatedAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .where(eq(user.id, userId))
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return {
    findById,
    findProfileById,
    create,
    lockById,
    updateMetadata,
  } as const;
});
export class UserRepository extends Context.Service<
  UserRepository,
  Effect.Success<typeof makeUserRepository>
>()("@usepreface/database/repositories/auth/UserRepository") {
  static readonly layer = Layer.effect(UserRepository, makeUserRepository);
}
