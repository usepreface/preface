import { expect, layer } from "@effect/vitest";
import { Deferred, Effect, Fiber } from "effect";

import { Database, InstanceRepository, TransactionService } from "../../../src/index.js";
import { user } from "../../../src/schema/auth/user.js";
import { TestDatabase } from "../../../src/testing/index.js";
import { InstanceTestLayer } from "../../fixtures/database.js";
import { createTestUser } from "../../fixtures/user.js";

layer(InstanceTestLayer)("transaction propagation", (it) => {
  it.effect("rolls back nested repository writes when the outer operation fails", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const transaction = yield* TransactionService;
      const database = yield* Database;
      const rejection = { _tag: "SetupRejected" } as const;

      const failure = yield* transaction
        .run(
          Effect.gen(function* () {
            yield* repository.initialize();
            const account = yield* createTestUser();
            yield* repository.owner.grant({
              userId: account.id,
              grantSource: "bootstrap",
              grantedByUserId: null,
            });
            return yield* Effect.fail(rejection);
          }),
        )
        .pipe(Effect.flip);

      expect(failure).toBe(rejection);
      expect(yield* repository.installation.find()).toBeUndefined();
      expect(yield* repository.owner.listActive()).toEqual([]);
      expect(yield* database.select().from(user)).toEqual([]);
    }),
  );

  it.effect("joins nested transactions without introducing an implicit savepoint", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const transaction = yield* TransactionService;
      const database = yield* Database;

      yield* transaction.run(
        transaction
          .run(createTestUser().pipe(Effect.andThen(Effect.fail("recoverable"))))
          .pipe(Effect.catch(() => Effect.void)),
      );

      expect(yield* database.select().from(user)).toHaveLength(1);
    }),
  );

  it.effect("rolls back a cancelled transaction and releases its connection", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const transaction = yield* TransactionService;
      const database = yield* Database;
      const written = yield* Deferred.make<void>();

      const pending = yield* transaction
        .run(
          Effect.gen(function* () {
            yield* createTestUser();
            yield* Deferred.succeed(written, undefined);
            yield* Effect.never;
          }),
        )
        .pipe(Effect.forkChild);

      yield* Deferred.await(written);
      yield* Fiber.interrupt(pending);

      expect(yield* database.select().from(user)).toEqual([]);
      const afterCancellation = yield* createTestUser();
      expect(yield* database.query.user.findFirst()).toEqual(afterCancellation);
    }),
  );
});
