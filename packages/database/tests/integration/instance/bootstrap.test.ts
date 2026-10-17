import { expect, layer } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import { TestClock } from "effect/testing";

import { Database, InstanceRepository, TransactionService } from "../../../src/index.js";
import { auditEvent } from "../../../src/schema/audit/index.js";
import { passwordCredential, session, user } from "../../../src/schema/auth/index.js";
import { TestDatabase } from "../../../src/testing/index.js";
import { InstanceTestLayer } from "../../fixtures/database.js";
import { createTestUser } from "../../fixtures/user.js";

layer(InstanceTestLayer)("bootstrap persistence", (it) => {
  it.effect("replaces setup tokens and consumes the current token only once", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      const expiresAt = DateTime.add(yield* DateTime.now, { minutes: 10 });
      yield* repository.installation.issueBootstrapToken({ hash: "old-digest", expiresAt });
      yield* repository.installation.issueBootstrapToken({ hash: "current-digest", expiresAt });
      const owner = yield* createTestUser();
      yield* repository.owner.grant({
        userId: owner.id,
        grantSource: "bootstrap",
        grantedByUserId: null,
      });

      expect(yield* repository.installation.completeBootstrap("old-digest")).toBeUndefined();

      const completions = yield* Effect.all(
        [
          repository.installation.completeBootstrap("current-digest"),
          repository.installation.completeBootstrap("current-digest"),
        ],
        { concurrency: 2 },
      );

      expect(completions.filter((completed) => completed !== undefined)).toHaveLength(1);
      const current = yield* repository.installation.find();
      expect(current?.bootstrapCompletedAt).not.toBeNull();
      expect(current?.bootstrapTokenHash).toBeNull();
      expect(current?.bootstrapTokenIssuedAt).toBeNull();
      expect(current?.bootstrapTokenExpiresAt).toBeNull();

      const restarted = yield* repository.initialize();
      expect(restarted.created).toBe(false);
      expect(restarted.installation.bootstrapCompletedAt).toEqual(current?.bootstrapCompletedAt);
      expect(restarted.installation.bootstrapTokenHash).toBeNull();
      expect(
        yield* repository.installation.issueBootstrapToken({ hash: "reopen", expiresAt }),
      ).toBeUndefined();
      expect(yield* repository.installation.completeBootstrap("current-digest")).toBeUndefined();
    }),
  );

  it.effect("keeps setup incomplete when there is no owner or the token has expired", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      yield* repository.installation.issueBootstrapToken({
        hash: "setup-digest",
        expiresAt: DateTime.add(yield* DateTime.now, { minutes: 10 }),
      });

      expect(yield* repository.installation.completeBootstrap("setup-digest")).toBeUndefined();

      const owner = yield* createTestUser();
      yield* repository.owner.grant({
        userId: owner.id,
        grantSource: "bootstrap",
        grantedByUserId: null,
      });
      yield* TestClock.adjust("10 minutes");

      expect(yield* repository.installation.completeBootstrap("setup-digest")).toBeUndefined();
      expect((yield* repository.installation.find())?.bootstrapCompletedAt).toBeNull();
    }),
  );

  it.effect("rolls back all bootstrap storage when its required audit write fails", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const database = yield* Database;
      const repository = yield* InstanceRepository;
      const failure = yield* (yield* TransactionService)
        .run(
          Effect.gen(function* () {
            const initialized = yield* repository.initialize();
            const now = yield* DateTime.now;
            const createdAt = DateTime.toDateUtc(now);
            const account = yield* createTestUser();
            yield* database.insert(passwordCredential).values({
              userId: account.id,
              passwordHash: "encoded-test-hash",
              createdAt,
              passwordChangedAt: createdAt,
            });
            yield* database.insert(session).values({
              userId: account.id,
              tokenHash: "a".repeat(64),
              createdAt,
              lastSeenAt: createdAt,
              expiresAt: DateTime.toDateUtc(DateTime.add(now, { hours: 1 })),
            });
            yield* repository.owner.grant({
              userId: account.id,
              grantSource: "bootstrap",
              grantedByUserId: null,
            });
            yield* repository.installation.issueBootstrapToken({
              hash: "setup-digest",
              expiresAt: DateTime.add(now, { minutes: 10 }),
            });
            expect(yield* repository.installation.completeBootstrap("setup-digest")).toBeDefined();
            yield* database.insert(auditEvent).values({
              eventType: "instance.bootstrap_completed",
              actorKind: "user",
              actorUserId: null,
              targetType: "installation",
              targetId: initialized.installation.installationId,
              occurredAt: createdAt,
            });
          }),
        )
        .pipe(Effect.flip);
      expect(failure).toMatchObject({
        reason: { _tag: "ConstraintError", cause: { constraint: "event_actor_attribution_check" } },
      });
      expect(yield* repository.installation.find()).toBeUndefined();
      expect(yield* repository.settings.find()).toBeUndefined();
      expect(yield* repository.owner.listActive()).toEqual([]);
      expect(yield* database.select().from(user)).toEqual([]);
      expect(yield* database.select().from(passwordCredential)).toEqual([]);
      expect(yield* database.select().from(session)).toEqual([]);
      expect(yield* database.select().from(auditEvent)).toEqual([]);
    }),
  );
});
