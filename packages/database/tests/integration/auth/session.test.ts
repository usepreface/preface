import { expect, layer } from "@effect/vitest";
import { DateTime, Duration, Effect } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository } from "../../../src/index.js";
import { TestDatabase } from "../../../src/testing/index.js";
import { RepositoryTestLayer } from "../../fixtures/database.js";

layer(RepositoryTestLayer)("session lifecycle", (it) => {
  it.effect("keeps activity monotonic without extending or reviving an expired session", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* DatabaseRepository;
      const database = yield* Database;
      const account = yield* repository.auth.user.create({
        metadata: { version: 1, name: "Session Owner" },
      });
      const createdAt = yield* DateTime.now;
      const expiresAt = DateTime.add(createdAt, { minutes: 10 });
      const session = yield* repository.auth.session.create({
        userId: account.id,
        tokenHash: "b".repeat(64),
        expiresAt,
      });

      yield* TestClock.adjust("2 minutes");
      const active = yield* repository.auth.session.recordActivity(session.id);
      expect(active?.lastSeenAt).toEqual(DateTime.add(createdAt, { minutes: 2 }));
      expect(active?.expiresAt).toEqual(expiresAt);

      yield* TestClock.setTime(DateTime.toEpochMillis(DateTime.add(createdAt, { minutes: 1 })));
      const olderRequest = yield* repository.auth.session.recordActivity(session.id);
      expect(olderRequest?.lastSeenAt).toEqual(active?.lastSeenAt);
      expect(yield* repository.auth.session.findActiveByTokenHash(session.tokenHash)).toEqual(
        olderRequest,
      );

      yield* TestClock.setTime(DateTime.toEpochMillis(DateTime.add(createdAt, { minutes: 3 })));
      expect(
        yield* repository.auth.session.recordActivity(session.id, Duration.minutes(1)),
      ).toBeUndefined();
      expect(yield* repository.auth.session.findActiveByTokenHash(session.tokenHash)).toEqual(
        olderRequest,
      );

      yield* TestClock.setTime(DateTime.toEpochMillis(expiresAt));
      expect(
        yield* repository.auth.session.findActiveByTokenHash(session.tokenHash),
      ).toBeUndefined();
      expect(yield* repository.auth.session.recordActivity(session.id)).toBeUndefined();

      const persisted = yield* database.query.session.findFirst({
        where: { id: { eq: session.id } },
      });
      expect(persisted?.lastSeenAt).toEqual(
        DateTime.toDateUtc(DateTime.add(createdAt, { minutes: 2 })),
      );
      expect(persisted?.expiresAt).toEqual(DateTime.toDateUtc(expiresAt));
    }),
  );

  it.effect("revokes only the supplied user's session and preserves the original revocation", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* DatabaseRepository;
      const database = yield* Database;
      const owner = yield* repository.auth.user.create({ metadata: { version: 1, name: "Owner" } });
      const otherUser = yield* repository.auth.user.create({
        metadata: { version: 1, name: "Other" },
      });
      const session = yield* repository.auth.session.create({
        userId: owner.id,
        tokenHash: "c".repeat(64),
        expiresAt: DateTime.add(yield* DateTime.now, { hours: 1 }),
      });

      expect(yield* repository.auth.session.revoke(session.id, otherUser.id)).toBeUndefined();
      expect(yield* repository.auth.session.findActiveByTokenHash(session.tokenHash)).toEqual(
        session,
      );

      yield* TestClock.adjust("1 minute");
      const revokedAt = yield* DateTime.now;
      const revoked = yield* repository.auth.session.revoke(session.id, owner.id);
      expect(revoked?.revokedAt).toEqual(revokedAt);

      yield* TestClock.adjust("1 minute");
      expect(yield* repository.auth.session.revoke(session.id, owner.id)).toBeUndefined();
      expect(
        yield* repository.auth.session.findActiveByTokenHash(session.tokenHash),
      ).toBeUndefined();
      expect(yield* repository.auth.session.recordActivity(session.id)).toBeUndefined();

      const persisted = yield* database.query.session.findFirst({
        where: { id: { eq: session.id } },
      });
      expect(persisted?.revokedAt).toEqual(DateTime.toDateUtc(revokedAt));
      expect(persisted?.lastSeenAt).toEqual(DateTime.toDateUtc(session.createdAt));
    }),
  );
});
