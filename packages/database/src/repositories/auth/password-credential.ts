import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { UserId } from "@usepreface/protocol";
import { PasswordCredential, SetPasswordCredential } from "@usepreface/protocol/model";
import { eq } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { passwordCredential } from "#/schema/auth/password-credential";

const makePasswordCredentialRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeSync(PasswordCredential);
  const encode = Schema.encodeSync(SetPasswordCredential);

  const findByUserId = Effect.fn("PasswordCredentialRepository.findByUserId")(function* (
    userId: UserId,
  ) {
    const [row] = yield* database
      .select()
      .from(passwordCredential)
      .where(eq(passwordCredential.userId, userId));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const create = Effect.fn("PasswordCredentialRepository.create")(function* (
    input: SetPasswordCredential,
  ) {
    const encoded = encode(input);
    const now = DateTime.toDateUtc(yield* DateTime.now);

    const [row] = yield* database
      .insert(passwordCredential)
      .values({ ...encoded, userId: input.userId, createdAt: now, passwordChangedAt: now })
      .returning();

    if (row === undefined)
      return yield* Effect.die(new Error("Password credential insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);

  return { findByUserId, create } as const;
});

export class PasswordCredentialRepository extends Context.Service<
  PasswordCredentialRepository,
  Effect.Success<typeof makePasswordCredentialRepository>
>()("@usepreface/database/repositories/auth/PasswordCredentialRepository") {
  static readonly layer = Layer.effect(
    PasswordCredentialRepository,
    makePasswordCredentialRepository,
  );
}
