import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { UserEmailId, UserId } from "@usepreface/protocol";
import { CreateUserEmail, UserEmailAddress } from "@usepreface/protocol/model";
import { and, eq, isNull } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { userEmail } from "#/schema/auth/user-email";

const makeUserEmailRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(UserEmailAddress);
  const create = Effect.fn("UserEmailRepository.create")(function* (input: CreateUserEmail) {
    const now = DateTime.toDateUtc(yield* DateTime.now);
    const encoded = Schema.encodeSync(CreateUserEmail)(input);
    const [row] = yield* database
      .insert(userEmail)
      .values({ ...encoded, userId: input.userId, createdAt: now, updatedAt: now })
      .returning();
    if (row === undefined) return yield* Effect.die(new Error("Email insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);
  const findById = Effect.fn("UserEmailRepository.findById")(function* (id: UserEmailId) {
    const [row] = yield* database.select().from(userEmail).where(eq(userEmail.id, id));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findActiveByEmail = Effect.fn("UserEmailRepository.findActiveByEmail")(function* (
    email: string,
  ) {
    const [row] = yield* database
      .select()
      .from(userEmail)
      .where(and(eq(userEmail.email, email), isNull(userEmail.removedAt)));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  const findPrimaryByUserId = Effect.fn("UserEmailRepository.findPrimaryByUserId")(function* (
    userId: UserId,
  ) {
    const [row] = yield* database
      .select()
      .from(userEmail)
      .where(
        and(
          eq(userEmail.userId, userId),
          eq(userEmail.isPrimary, true),
          isNull(userEmail.removedAt),
        ),
      );
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);
  return { create, findById, findActiveByEmail, findPrimaryByUserId } as const;
});
export class UserEmailRepository extends Context.Service<
  UserEmailRepository,
  Effect.Success<typeof makeUserEmailRepository>
>()("@usepreface/database/repositories/auth/UserEmailRepository") {
  static readonly layer = Layer.effect(UserEmailRepository, makeUserEmailRepository);
}
