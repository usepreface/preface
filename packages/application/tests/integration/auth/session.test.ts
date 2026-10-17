import { expect, layer } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";
import { signInTestUser } from "../../fixtures/email-sign-in.js";

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
        metadata: { version: 1, name: "Other User" },
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
  it.effect(
    "paginates only the actor's usable sessions and revokes one or all with atomic audit",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const first = yield* completeTestBootstrap;
        const second = yield* signInTestUser();
        const third = yield* signInTestUser();
        const other = yield* repository.auth.user.create({
          metadata: { version: 1, name: "Other" },
        });
        yield* repository.auth.userEmail.create({
          userId: other.id,
          email: "other@example.test",
          isPrimary: true,
          loginEnabled: true,
          verifiedAt: yield* DateTime.now,
        });
        const otherSession = yield* signInTestUser("other@example.test");
        const page = yield* application.auth.session.list(third.actor, { limit: 2 });
        expect(page.sessions.map((session) => session.id)).toEqual([
          third.actor.session.id,
          second.actor.session.id,
        ]);
        expect(page.sessions.map((session) => session.isCurrent)).toEqual([true, false]);
        if (page.nextCursor === null) throw new Error("Expected next cursor");
        expect(
          yield* application.auth.session.list(third.actor, { cursor: page.nextCursor, limit: 2 }),
        ).toMatchObject({ sessions: [{ id: first.actor.session.id }], nextCursor: null });
        yield* application.auth.session.revoke(third.actor, otherSession.actor.session.id);
        expect(yield* application.auth.session.resolve(otherSession.sessionToken)).toEqual(
          otherSession.actor,
        );
        yield* application.auth.session.revoke(third.actor, second.actor.session.id);
        expect(
          yield* application.auth.session.resolve(second.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });

        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.auth.session.revokeAll(third.actor).pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(yield* application.auth.session.resolve(first.sessionToken)).toEqual(first.actor);
        expect(yield* application.auth.session.resolve(third.sessionToken)).toEqual(third.actor);
        yield* application.auth.session.revokeAll(third.actor);
        expect(
          yield* application.auth.session.resolve(first.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
        expect(
          yield* application.auth.session.resolve(third.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
        expect(yield* application.auth.session.resolve(otherSession.sessionToken)).toEqual(
          otherSession.actor,
        );
        expect(
          yield* database.query.auditEvent.findMany({
            where: { eventType: { eq: "auth.session_revoked" } },
          }),
        ).toHaveLength(3);
      }),
  );

  it.effect(
    "rejects sessions after their authentication evidence or email source becomes unusable",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const first = yield* completeTestBootstrap;
        yield* repository.auth.sessionAuthentication.revokeBySessionId(
          first.actor.session.id,
          first.actor.user.id,
        );
        expect(
          yield* application.auth.session.resolve(first.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
        const current = yield* signInTestUser();
        yield* database.$client`update auth.user_email set login_enabled = false where user_id = ${current.actor.user.id}`;
        expect(
          yield* application.auth.session.resolve(current.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
        expect(yield* application.auth.session.list(current.actor, {})).toEqual({
          sessions: [],
          nextCursor: null,
        });
      }),
  );
});
