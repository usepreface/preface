import { expect, layer } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";

layer(ApplicationTestLayer)("authenticated sessions", (it) => {
  it.effect("throttles activity without extending absolute expiry and rejects idle sessions", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const database = yield* Database;
      const createdAt = yield* DateTime.now;
      const completed = yield* completeTestBootstrap;

      yield* TestClock.adjust("4 minutes");
      yield* application.auth.session.resolve(completed.sessionToken);
      expect((yield* database.query.session.findFirst())?.lastSeenAt).toEqual(
        DateTime.toDateUtc(createdAt),
      );

      yield* TestClock.adjust("1 minute");
      const activeAt = yield* DateTime.now;
      expect(yield* application.auth.session.resolve(completed.sessionToken)).toEqual(
        completed.actor,
      );
      expect((yield* database.query.session.findFirst())?.lastSeenAt).toEqual(
        DateTime.toDateUtc(activeAt),
      );
      expect((yield* database.query.session.findFirst())?.expiresAt).toEqual(
        DateTime.toDateUtc(completed.actor.session.expiresAt),
      );

      yield* TestClock.adjust("7 days");
      expect(
        yield* application.auth.session.resolve(completed.sessionToken).pipe(Effect.flip),
      ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
      expect((yield* database.query.session.findFirst())?.lastSeenAt).toEqual(
        DateTime.toDateUtc(activeAt),
      );
    }),
  );

  it.effect(
    "checks user disablement freshly and never authenticates an absolutely expired session",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const sql = (yield* Database).$client;
        const completed = yield* completeTestBootstrap;
        yield* application.auth.session.resolve(completed.sessionToken);

        yield* sql`update auth.user set disabled_at = ${DateTime.toDateUtc(yield* DateTime.now)} where id = ${completed.actor.user.id}`;
        expect(
          yield* application.auth.session.resolve(completed.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });

        yield* sql`update auth.user set disabled_at = null where id = ${completed.actor.user.id}`;
        yield* TestClock.setTime(DateTime.toEpochMillis(completed.actor.session.expiresAt));
        expect(
          yield* application.auth.session.resolve(completed.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
      }),
  );

  it.effect("revokes only the actor's session, audits once, and rolls back when audit fails", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const database = yield* Database;
      const completed = yield* completeTestBootstrap;
      const otherUser = yield* repository.auth.user.create({
        displayName: "Other User",
        email: "other@example.test",
      });

      yield* application.auth.session.revokeCurrent({
        ...completed.actor,
        user: { ...completed.actor.user, id: otherUser.id },
      });
      yield* application.auth.session.resolve(completed.sessionToken);
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* rejectLifecycleAudit;
          expect(
            yield* application.auth.session.revokeCurrent(completed.actor).pipe(Effect.flip),
          ).toMatchObject({ _tag: "DatabaseError" });
        }),
      );
      expect(yield* application.auth.session.resolve(completed.sessionToken)).toEqual(
        completed.actor,
      );

      yield* application.auth.session.revokeCurrent(completed.actor);
      yield* application.auth.session.revokeCurrent(completed.actor);
      expect(
        yield* application.auth.session.resolve(completed.sessionToken).pipe(Effect.flip),
      ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
      const events = yield* database.query.auditEvent.findMany({
        where: { eventType: { eq: "auth.session_revoked" } },
      });
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        actorUserId: completed.actor.user.id,
        targetId: completed.actor.session.id,
      });
    }),
  );
});
