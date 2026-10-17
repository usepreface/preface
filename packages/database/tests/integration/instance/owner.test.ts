import { expect, layer } from "@effect/vitest";
import { Effect, Result } from "effect";

import { eq } from "drizzle-orm";

import { Database, InstanceRepository } from "../../../src/index.js";
import { instanceOwner } from "../../../src/schema/instance/owner.js";
import { TestDatabase } from "../../../src/testing/index.js";
import { InstanceTestLayer } from "../../fixtures/database.js";
import { createTestUser } from "../../fixtures/user.js";

layer(InstanceTestLayer)("owner persistence", (it) => {
  it.effect("prevents concurrent revocations from removing the final owner", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      const firstUser = yield* createTestUser();
      const secondUser = yield* createTestUser();
      const first = yield* repository.owner.grant({
        userId: firstUser.id,
        grantSource: "bootstrap",
        grantedByUserId: null,
      });
      const second = yield* repository.owner.grant({
        userId: secondUser.id,
        grantSource: "owner",
        grantedByUserId: first.userId,
      });
      const results = yield* Effect.all(
        [first, second].map((grant) =>
          repository.owner
            .revoke({
              id: grant.id,
              revokedByUserId: first.userId,
              revocationReason: null,
            })
            .pipe(Effect.result),
        ),
        { concurrency: 2 },
      );
      expect(results.filter(Result.isSuccess)).toHaveLength(1);
      const failed = results.find(Result.isFailure);
      expect(failed).toMatchObject({ failure: { _tag: "InstanceStateError", code: "LAST_OWNER" } });
      expect(yield* repository.owner.listActive()).toHaveLength(1);
    }),
  );

  it.effect("retains revoked grants when a user becomes an owner again", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const database = yield* Database;
      yield* repository.initialize();
      const firstUser = yield* createTestUser();
      const secondUser = yield* createTestUser();
      const firstOwner = yield* repository.owner.grant({
        userId: firstUser.id,
        grantSource: "bootstrap",
        grantedByUserId: null,
      });
      const secondOwner = yield* repository.owner.grant({
        userId: secondUser.id,
        grantSource: "owner",
        grantedByUserId: firstOwner.userId,
      });

      yield* repository.owner.revoke({
        id: secondOwner.id,
        revokedByUserId: firstOwner.userId,
        revocationReason: "Access removed",
      });
      const restoredOwner = yield* repository.owner.grant({
        userId: secondUser.id,
        grantSource: "owner",
        grantedByUserId: firstOwner.userId,
      });

      const history = yield* database
        .select()
        .from(instanceOwner)
        .where(eq(instanceOwner.userId, secondUser.id));
      expect(history.map((grant) => grant.id)).toEqual(
        expect.arrayContaining([secondOwner.id, restoredOwner.id]),
      );
      expect(history.filter((grant) => grant.revokedAt !== null)).toHaveLength(1);
      expect((yield* repository.owner.findActiveByUserId(secondUser.id))?.id).toBe(
        restoredOwner.id,
      );
    }),
  );
});
