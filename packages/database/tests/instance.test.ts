import { expect, layer } from "@effect/vitest";
import { Cause, DateTime, Effect, Exit, Layer, Result, Schema } from "effect";

import { InstanceStateError, UserId } from "@usepreface/protocol";
import { eq, sql } from "drizzle-orm";

import {
  Database,
  DatabaseError,
  generateUuid7,
  InstanceRepository,
  mapToDatabaseError,
  TransactionService,
} from "../src/index.js";
import { installation } from "../src/schema/instance/installation.js";
import { instanceOwner } from "../src/schema/instance/owner.js";
import { instanceSettings } from "../src/schema/instance/settings.js";
import { TestDatabase } from "../src/testing/index.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;
const databaseLayer: Layer.Layer<Layer.Success<typeof TestDatabase.layer>, unknown> = port ===
undefined
  ? TestDatabase.layer
  : TestDatabase.postgresLayer(Number(port));
const persistence = InstanceRepository.layer.pipe(Layer.provideMerge(databaseLayer));
const userId = () => Schema.decodeSync(UserId)(generateUuid7());

layer(persistence)("instance persistence", (it) => {
  it.effect("initializes installation and defaults once without overwriting settings", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const first = yield* repository.initialize();
      expect(first.created).toBe(true);
      expect(first.settings.displayName).toBe("Preface");
      expect(first.settings.revision).toBe(1);
      expect(first.installation.bootstrapCompletedAt).toBeNull();
      expect(first.installation.bootstrapTokenHash).toBeNull();
      yield* repository.settings.update({ revision: 1, displayName: "Our Preface" });
      const second = yield* repository.initialize();
      expect(second.created).toBe(false);
      expect(second.installation.installationId).toBe(first.installation.installationId);
      expect(second.settings.displayName).toBe("Our Preface");
      expect(second.settings.revision).toBe(2);
      expect(yield* repository.owner.listActive()).toEqual([]);
    }),
  );

  it.effect("initializes one shared installation under concurrent startup", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const results = yield* Effect.all([repository.initialize(), repository.initialize()], {
        concurrency: 2,
      });
      expect(results.filter((result) => result.created)).toHaveLength(1);
      expect(results[0]?.installation.installationId).toBe(results[1]?.installation.installationId);
      expect(yield* (yield* Database).select().from(instanceSettings)).toHaveLength(1);
    }),
  );

  it.effect("rolls back initialization, settings and nested owner grants together", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const transaction = yield* TransactionService;
      const failure = yield* transaction
        .run(
          Effect.gen(function* () {
            yield* repository.initialize();
            yield* repository.settings.update({ revision: 1, displayName: "Rolled back" });
            yield* repository.owner.grant({
              userId: userId(),
              grantSource: "bootstrap",
              grantedByUserId: null,
            });
            yield* repository.installation.issueBootstrapToken({
              hash: "transaction-digest",
              expiresAt: DateTime.add(yield* DateTime.now, { minutes: 10 }),
            });
            const completed =
              yield* repository.installation.completeBootstrap("transaction-digest");
            expect(completed?.bootstrapCompletedAt).not.toBeNull();
            return yield* Effect.fail("reject setup");
          }),
        )
        .pipe(Effect.flip);
      expect(failure).toBe("reject setup");
      expect(yield* repository.installation.find()).toBeUndefined();
      expect(yield* repository.settings.find()).toBeUndefined();
      expect(yield* repository.owner.listActive()).toEqual([]);
    }),
  );

  it.effect("allows one settings edit per revision and uses the Effect clock", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      const now = yield* DateTime.now;
      const edits = yield* Effect.all(
        [
          repository.settings.update({ displayName: "First", revision: 1 }),
          repository.settings.update({ displayName: "Second", revision: 1 }),
        ],
        { concurrency: 2 },
      );
      expect(edits.filter((edited) => edited !== undefined)).toHaveLength(1);
      const current = yield* repository.settings.find();
      expect(current?.revision).toBe(2);
      expect(current === undefined ? undefined : DateTime.toEpochMillis(current.updatedAt)).toBe(
        DateTime.toEpochMillis(now),
      );
      expect(
        yield* repository.settings.update({ displayName: "Stale", revision: 1 }),
      ).toBeUndefined();
    }),
  );

  it.effect("replaces setup tokens and consumes the current token only once", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      const expiresAt = DateTime.add(yield* DateTime.now, { minutes: 10 });
      yield* repository.installation.issueBootstrapToken({ hash: "old-digest", expiresAt });
      yield* repository.installation.issueBootstrapToken({ hash: "current-digest", expiresAt });
      yield* repository.owner.grant({
        userId: userId(),
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
      const grantError = yield* repository.owner
        .grant({ userId: userId(), grantSource: "bootstrap", grantedByUserId: null })
        .pipe(Effect.flip);
      expect(grantError).toMatchObject({ code: "BOOTSTRAP_COMPLETED" });
    }),
  );

  it.effect("rejects completion without an owner and rejects expired or future-issued tokens", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const database = yield* Database;
      yield* repository.initialize();
      const now = yield* DateTime.now;
      yield* repository.installation.issueBootstrapToken({
        hash: "digest",
        expiresAt: DateTime.add(now, { minutes: 10 }),
      });
      expect(yield* repository.installation.completeBootstrap("digest")).toBeUndefined();
      yield* repository.owner.grant({
        userId: userId(),
        grantSource: "bootstrap",
        grantedByUserId: null,
      });
      const invalidExpiry = yield* repository.installation
        .issueBootstrapToken({ hash: "digest", expiresAt: now })
        .pipe(Effect.flip);
      expect(invalidExpiry).toMatchObject({ code: "INVALID_BOOTSTRAP_EXPIRY" });
      yield* database.update(installation).set({
        bootstrapTokenIssuedAt: DateTime.toDateUtc(DateTime.add(now, { minutes: -2 })),
        bootstrapTokenExpiresAt: DateTime.toDateUtc(DateTime.add(now, { minutes: -1 })),
      });
      expect(yield* repository.installation.completeBootstrap("digest")).toBeUndefined();
      yield* database.update(installation).set({
        bootstrapTokenIssuedAt: DateTime.toDateUtc(DateTime.add(now, { minutes: 1 })),
        bootstrapTokenExpiresAt: DateTime.toDateUtc(DateTime.add(now, { minutes: 2 })),
      });
      expect(yield* repository.installation.completeBootstrap("digest")).toBeUndefined();
    }),
  );

  it.effect("enforces singleton, token-field and foreign-key constraints in PostgreSQL", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const database = yield* Database;
      const orphan = yield* database
        .insert(instanceSettings)
        .values({ installationId: 1 })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(orphan.reason).toMatchObject({ _tag: "ConstraintError" });
      const secondRow = yield* database
        .execute(
          sql`insert into instance.installation (id, installation_id) values (2, ${generateUuid7()}::uuid)`,
        )
        .pipe(mapToDatabaseError, Effect.flip);
      expect(secondRow.reason).toMatchObject({ _tag: "ConstraintError" });
      yield* (yield* InstanceRepository).initialize();
      const partialToken = yield* database
        .update(installation)
        .set({ bootstrapTokenHash: "digest" })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(partialToken.reason).toMatchObject({ _tag: "ConstraintError" });
      const backwardsExpiry = yield* database
        .update(installation)
        .set({
          bootstrapTokenHash: "digest",
          bootstrapTokenIssuedAt: new Date(1_000),
          bootstrapTokenExpiresAt: new Date(0),
        })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(backwardsExpiry.reason).toMatchObject({ _tag: "ConstraintError" });
      yield* database.update(installation).set({
        bootstrapTokenHash: "digest",
        bootstrapTokenIssuedAt: new Date(0),
        bootstrapTokenExpiresAt: new Date(60_000),
      });
      const completedWithToken = yield* database
        .update(installation)
        .set({ bootstrapCompletedAt: new Date(1) })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(completedWithToken.reason).toMatchObject({ _tag: "ConstraintError" });
      const referenced = yield* database.delete(installation).pipe(mapToDatabaseError, Effect.flip);
      expect(referenced.reason).toMatchObject({ _tag: "ConstraintError" });
    }),
  );

  it.effect("enforces active-owner uniqueness and preserves revoked grant history", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const database = yield* Database;
      yield* repository.initialize();
      const first = yield* repository.owner.grant({
        userId: userId(),
        grantSource: "bootstrap",
        grantedByUserId: null,
      });
      const secondUser = userId();
      const input = {
        userId: secondUser,
        grantSource: "owner",
        grantedByUserId: first.userId,
      } as const;
      const second = yield* repository.owner.grant(input);
      const duplicate = yield* repository.owner.grant(input).pipe(Effect.flip);
      expect(duplicate).toBeInstanceOf(DatabaseError);
      expect(duplicate).toMatchObject({
        reason: { _tag: "UniqueViolation", constraint: "owner_active_user_uidx" },
      });
      const duplicateBootstrap = yield* repository.owner
        .grant({ userId: userId(), grantSource: "bootstrap", grantedByUserId: null })
        .pipe(Effect.flip);
      expect(duplicateBootstrap).toMatchObject({
        reason: { _tag: "UniqueViolation", constraint: "owner_bootstrap_uidx" },
      });
      const revoked = yield* repository.owner.revoke({
        id: second.id,
        revokedByUserId: first.userId,
        revocationReason: "Access removed",
      });
      expect(revoked?.revokedAt).not.toBeNull();
      expect(yield* repository.owner.findActiveByUserId(secondUser)).toBeUndefined();
      const restored = yield* repository.owner.grant(input);
      expect(restored.id).not.toBe(second.id);
      const history = yield* database
        .select()
        .from(instanceOwner)
        .where(eq(instanceOwner.userId, secondUser));
      expect(history).toHaveLength(2);
      expect(history.filter((grant) => grant.revokedAt !== null)).toHaveLength(1);
      expect(
        yield* repository.owner.revoke({
          id: second.id,
          revokedByUserId: first.userId,
          revocationReason: null,
        }),
      ).toBeUndefined();
    }),
  );

  it.effect("prevents concurrent revocations from removing the final owner", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      const first = yield* repository.owner.grant({
        userId: userId(),
        grantSource: "bootstrap",
        grantedByUserId: null,
      });
      const second = yield* repository.owner.grant({
        userId: userId(),
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

  it.effect("loads registered installation relations", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      yield* repository.owner.grant({
        userId: userId(),
        grantSource: "bootstrap",
        grantedByUserId: null,
      });
      const related = yield* (yield* Database).query.installation.findFirst({
        with: { settings: true, owners: true },
      });
      expect(related?.settings?.displayName).toBe("Preface");
      expect(related?.owners).toHaveLength(1);
    }),
  );

  it.effect("rejects invalid settings and grant lifecycle writes at the database boundary", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const database = yield* Database;
      yield* repository.initialize();
      const revision = yield* database
        .update(instanceSettings)
        .set({ revision: 0 })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(revision.reason).toMatchObject({ _tag: "ConstraintError" });
      const name = yield* database
        .update(instanceSettings)
        .set({ displayName: "" })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(name.reason).toMatchObject({ _tag: "ConstraintError" });
      const actor = yield* database
        .insert(instanceOwner)
        .values({
          userId: userId(),
          grantSource: "owner",
          grantedByUserId: null,
          grantedAt: new Date(0),
        })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(actor.reason).toMatchObject({ _tag: "ConstraintError" });
      yield* repository.owner.grant({
        userId: userId(),
        grantSource: "bootstrap",
        grantedByUserId: null,
      });
      const metadata = yield* database
        .update(instanceOwner)
        .set({ revocationReason: "removed" })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(metadata.reason).toMatchObject({ _tag: "ConstraintError" });
      const backwards = yield* database
        .update(instanceOwner)
        .set({ revokedAt: DateTime.toDateUtc(DateTime.add(yield* DateTime.now, { seconds: -1 })) })
        .pipe(mapToDatabaseError, Effect.flip);
      expect(backwards.reason).toMatchObject({ _tag: "ConstraintError" });
    }),
  );

  it.effect("requires a transaction for explicit installation locks", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      const exit = yield* repository.installation.lock().pipe(Effect.exit);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) expect(Result.isSuccess(Cause.findDefect(exit.cause))).toBe(true);
      const locked = yield* (yield* TransactionService).run(repository.installation.lock());
      expect(locked.id).toBe(1);
    }),
  );

  it.effect("rejects owner changes before installation initialization", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const error = yield* (yield* InstanceRepository).owner
        .grant({ userId: userId(), grantSource: "bootstrap", grantedByUserId: null })
        .pipe(Effect.flip);
      expect(error).toBeInstanceOf(InstanceStateError);
      expect(error).toMatchObject({ code: "NOT_INITIALIZED" });
    }),
  );
});
