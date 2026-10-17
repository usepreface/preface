import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Schema } from "effect";
import { TestClock } from "effect/testing";

import { UserId } from "@usepreface/protocol";

import {
  Database,
  DatabaseRepository,
  generateUuid7,
  TransactionService,
} from "../../../src/index.js";
import { auditEvent } from "../../../src/schema/audit/index.js";
import { userEmail, session, user } from "../../../src/schema/auth/index.js";
import { TestDatabase } from "../../../src/testing/index.js";
import { RepositoryTestLayer } from "../../fixtures/database.js";
import { createTestUser } from "../../fixtures/user.js";

layer(RepositoryTestLayer)("bootstrap persistence", (it) => {
  it.effect("replaces setup tokens and consumes the current token only once", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = (yield* DatabaseRepository).instance;
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
      const repository = (yield* DatabaseRepository).instance;
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

  it.effect("rolls back every repository group when the required bootstrap audit write fails", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const database = yield* Database;
      const repository = yield* DatabaseRepository;
      const missingActorId = Schema.decodeSync(UserId)(generateUuid7());

      const failure = yield* (yield* TransactionService)
        .run(
          Effect.gen(function* () {
            const initialized = yield* repository.instance.initialize();
            const now = yield* DateTime.now;
            const account = yield* repository.auth.user.create({
              displayName: "First Owner",
            });
            yield* repository.auth.userEmail.create({
              userId: account.id,
              email: "bootstrap@example.test",
              isPrimary: true,
              loginEnabled: true,
              verifiedAt: now,
            });
            yield* repository.auth.session.create({
              userId: account.id,
              tokenHash: "a".repeat(64),
              expiresAt: DateTime.add(now, { hours: 1 }),
            });
            const owner = yield* repository.instance.owner.grant({
              userId: account.id,
              grantSource: "bootstrap",
              grantedByUserId: null,
            });
            yield* repository.audit.event.append({
              eventType: "instance.owner_granted",
              actorKind: "user",
              actorUserId: account.id,
              targetType: "instance_owner",
              targetId: owner.id,
              metadata: { grantSource: "bootstrap" },
            });
            yield* repository.instance.installation.issueBootstrapToken({
              hash: "setup-digest",
              expiresAt: DateTime.add(now, { minutes: 10 }),
            });
            expect(
              yield* repository.instance.installation.completeBootstrap("setup-digest"),
            ).toBeDefined();

            yield* repository.audit.event.append({
              eventType: "instance.bootstrap_completed",
              actorKind: "user",
              actorUserId: missingActorId,
              targetType: "installation",
              targetId: initialized.installation.installationId,
              metadata: {},
            });
          }),
        )
        .pipe(Effect.flip);

      expect(failure).toMatchObject({
        _tag: "DatabaseError",
        reason: {
          _tag: "ConstraintError",
          cause: { constraint: "event_actor_user_id_user_id_fkey" },
        },
      });
      expect(yield* repository.instance.installation.find()).toBeUndefined();
      expect(yield* repository.instance.settings.find()).toBeUndefined();
      expect(yield* repository.instance.owner.listActive()).toEqual([]);
      expect(yield* database.select().from(user)).toEqual([]);
      expect(yield* database.select().from(userEmail)).toEqual([]);
      expect(yield* database.select().from(session)).toEqual([]);
      expect(yield* database.select().from(auditEvent)).toEqual([]);
    }),
  );
});
