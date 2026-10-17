import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { UserId } from "@usepreface/protocol";
import { CreateUser, User } from "@usepreface/protocol/model";
import { eq } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { user } from "#/schema/auth/user";

const makeUserRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeSync(User);
  const encode = Schema.encodeSync(CreateUser);

  const findById = Effect.fn("UserRepository.findById")(function* (userId: UserId) {
    const [row] = yield* database.select().from(user).where(eq(user.id, userId));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const findByEmail = Effect.fn("UserRepository.findByEmail")(function* (email: User["email"]) {
    const [row] = yield* database.select().from(user).where(eq(user.email, email));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const create = Effect.fn("UserRepository.create")(function* (input: CreateUser) {
    const encoded = encode(input);
    const now = DateTime.toDateUtc(yield* DateTime.now);

    const [row] = yield* database
      .insert(user)
      .values({ ...encoded, createdAt: now, updatedAt: now })
      .returning();

    if (row === undefined) return yield* Effect.die(new Error("User insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);

  return { findById, findByEmail, create } as const;
});

export class UserRepository extends Context.Service<
  UserRepository,
  Effect.Success<typeof makeUserRepository>
>()("@usepreface/database/repositories/auth/UserRepository") {
  static readonly layer = Layer.effect(UserRepository, makeUserRepository);
}
