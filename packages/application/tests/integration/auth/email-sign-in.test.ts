import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Redacted, Result, Schema } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";
import { RequestEmailSignInInput } from "@usepreface/protocol/input";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";
import { requestEmailProof } from "../../fixtures/email-sign-in.js";

layer(ApplicationTestLayer)("email sign-in", (it) => {
  it.effect(
    "returns an idle operator to the same installation and identity without an organization",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const database = yield* Database;
        const first = yield* completeTestBootstrap;
        yield* TestClock.adjust("7 days");
        expect(
          yield* application.auth.session.resolve(first.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });

        const proof = yield* requestEmailProof(" Owner@Example.Test ");
        const signedIn = yield* application.auth.emailSignIn.verify({ ...proof, method: "code" });
        expect(signedIn.actor.user).toEqual(first.actor.user);
        expect(signedIn.actor.session.id).not.toBe(first.actor.session.id);
        expect(yield* application.auth.session.resolve(signedIn.sessionToken)).toEqual(
          signedIn.actor,
        );
        expect(yield* application.instance.bootstrap.getStatus()).toMatchObject({ state: "ready" });
        expect(yield* database.query.user.findMany()).toHaveLength(1);
        expect(yield* (yield* DatabaseRepository).instance.owner.listActive()).toHaveLength(1);
        const evidence = yield* database.query.sessionAuthentication.findMany({
          where: { sessionId: { eq: signedIn.actor.session.id } },
        });
        expect(evidence).toMatchObject([{ method: "email_code", userId: first.actor.user.id }]);
        expect(JSON.stringify(yield* database.query.verification.findMany())).not.toContain(
          Redacted.value(proof.code),
        );
      }),
  );

  it.effect(
    "binds proofs to the requesting browser, replaces old proofs, and consumes code/link only once",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        yield* completeTestBootstrap;
        const original = yield* requestEmailProof();
        const originalRow = yield* repository.auth.verification.findById(original.challengeId);
        const input = { ...original, method: "code" as const };
        expect(
          yield* application.auth.emailSignIn
            .verify({ ...input, browserToken: Redacted.make("wrong-browser") })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "EmailSignInError", code: "INVALID_PROOF" });
        expect((yield* repository.auth.verification.findById(original.challengeId))?.attempts).toBe(
          0,
        );

        const replacement = yield* application.auth.emailSignIn.resend({
          challengeId: original.challengeId,
          browserToken: original.browserToken,
        });
        expect(replacement.challenge.challengeId).not.toBe(original.challengeId);
        expect(
          (yield* repository.auth.verification.findById(original.challengeId))?.revokedAt,
        ).not.toBeNull();
        expect(originalRow?.emailJobId).toBeDefined();
        if (originalRow?.emailJobId === null || originalRow?.emailJobId === undefined)
          throw new Error("Expected email job");
        expect((yield* repository.jobs.email.findById(originalRow.emailJobId))?.status).toBe(
          "cancelled",
        );
        expect(yield* application.auth.emailSignIn.verify(input).pipe(Effect.flip)).toMatchObject({
          _tag: "EmailSignInError",
          code: "INVALID_PROOF",
        });

        const current = yield* requestEmailProof();
        const outcomes = yield* Effect.all(
          [
            application.auth.emailSignIn.verify({ ...current, method: "code" }).pipe(Effect.result),
            application.auth.emailSignIn
              .verify({ ...current, method: "magic_link" })
              .pipe(Effect.result),
          ],
          { concurrency: 2 },
        );
        expect(outcomes.filter(Result.isSuccess)).toHaveLength(1);
        expect(outcomes.find(Result.isFailure)?.failure).toMatchObject({
          _tag: "EmailSignInError",
          code: "INVALID_PROOF",
        });
        expect(yield* (yield* Database).query.session.findMany()).toHaveLength(2);
      }),
  );

  it.effect("coordinates simultaneous requests for the same recipient into one pending proof", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      yield* completeTestBootstrap;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const input = yield* Schema.decodeUnknownEffect(RequestEmailSignInInput)({
        email: "owner@example.test",
      });
      const requests = yield* Effect.all(
        [application.auth.emailSignIn.request(input), application.auth.emailSignIn.request(input)],
        { concurrency: 2 },
      );
      const first = yield* repository.auth.verification.findById(requests[0].challenge.challengeId);
      const second = yield* repository.auth.verification.findById(
        requests[1].challenge.challengeId,
      );
      expect([first, second].filter((proof) => proof?.revokedAt === null)).toHaveLength(1);
      expect(yield* (yield* Database).query.verification.findMany()).toHaveLength(2);
      expect(
        yield* (yield* Database).query.auditEvent.findMany({
          where: { eventType: { eq: "auth.email_sign_in_requested" } },
        }),
      ).toHaveLength(2);
    }),
  );

  it.effect(
    "commits a shared five-attempt budget under competing guesses and rejects expired proofs",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        yield* completeTestBootstrap;
        const proof = yield* requestEmailProof();
        const wrongCode = Redacted.make(
          Redacted.value(proof.code) === "00000000" ? "11111111" : "00000000",
        );
        const guess = { ...proof, method: "code" as const, code: wrongCode };
        const failures = yield* Effect.all(
          [
            application.auth.emailSignIn.verify(guess).pipe(Effect.flip),
            application.auth.emailSignIn.verify(guess).pipe(Effect.flip),
            application.auth.emailSignIn.verify(guess).pipe(Effect.flip),
            application.auth.emailSignIn.verify(guess).pipe(Effect.flip),
            application.auth.emailSignIn.verify(guess).pipe(Effect.flip),
          ],
          { concurrency: 5 },
        );
        expect(failures).toEqual(
          Array.from({ length: 5 }, () =>
            expect.objectContaining({ _tag: "EmailSignInError", code: "INVALID_PROOF" }),
          ),
        );
        expect((yield* repository.auth.verification.findById(proof.challengeId))?.attempts).toBe(5);
        expect(
          yield* application.auth.emailSignIn
            .verify({ ...proof, method: "code" })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "EmailSignInError", code: "INVALID_PROOF" });
        const events = yield* (yield* Database).query.auditEvent.findMany({
          where: { eventType: { eq: "auth.email_sign_in_failed" } },
        });
        expect(events).toHaveLength(5);

        const expired = yield* requestEmailProof();
        yield* TestClock.setTime(DateTime.toEpochMillis(expired.expiresAt));
        expect(
          yield* application.auth.emailSignIn
            .verify({ ...expired, method: "magic_link" })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "EmailSignInError", code: "INVALID_PROOF" });
        expect(yield* application.auth.emailSignIn.resend(expired).pipe(Effect.flip)).toMatchObject(
          { _tag: "EmailSignInError", code: "INVALID_PROOF" },
        );
      }),
  );

  it.effect(
    "does not enroll unknown or disabled accounts and rechecks the email source at completion",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const database = yield* Database;
        const repository = yield* DatabaseRepository;
        const owner = yield* completeTestBootstrap;
        const proof = yield* requestEmailProof();
        yield* database.$client`update auth.user_email set login_enabled = false where user_id = ${owner.actor.user.id}`;
        expect(
          yield* application.auth.emailSignIn
            .verify({ ...proof, method: "code" })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "EmailSignInError", code: "INVALID_PROOF" });
        const disabled = yield* application.auth.emailSignIn.request(
          yield* Schema.decodeUnknownEffect(RequestEmailSignInInput)({
            email: "owner@example.test",
          }),
        );
        const unknown = yield* application.auth.emailSignIn.request(
          yield* Schema.decodeUnknownEffect(RequestEmailSignInInput)({
            email: "unknown@example.test",
          }),
        );
        expect(Object.keys(disabled.challenge)).toEqual(Object.keys(unknown.challenge));
        expect(disabled.challenge.expiresAt).toEqual(unknown.challenge.expiresAt);
        expect(
          (yield* repository.auth.verification.findById(disabled.challenge.challengeId))
            ?.emailJobId,
        ).toBeNull();
        expect(
          (yield* repository.auth.verification.findById(unknown.challenge.challengeId))?.emailJobId,
        ).toBeNull();
        const resent = yield* application.auth.emailSignIn.resend({
          challengeId: unknown.challenge.challengeId,
          browserToken: unknown.browserToken,
        });
        expect(
          (yield* repository.auth.verification.findById(resent.challenge.challengeId))?.userId,
        ).toBeNull();
        expect(yield* database.query.user.findMany()).toHaveLength(1);
      }),
  );

  it.effect(
    "rolls back proof replacement, email intent, and session issuance when required audit fails",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const database = yield* Database;
        const repository = yield* DatabaseRepository;
        yield* completeTestBootstrap;
        const proof = yield* requestEmailProof();
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.auth.emailSignIn.resend(proof).pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
            expect(
              yield* application.auth.emailSignIn
                .verify({ ...proof, method: "code" })
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        const persisted = yield* repository.auth.verification.findById(proof.challengeId);
        expect(persisted).toMatchObject({ consumedAt: null, revokedAt: null });
        expect(yield* database.query.verification.findMany()).toHaveLength(1);
        expect(yield* database.query.session.findMany()).toHaveLength(1);
        expect(yield* database.query.sessionAuthentication.findMany()).toHaveLength(1);
        if (persisted?.emailJobId === null || persisted?.emailJobId === undefined)
          throw new Error("Expected job");
        expect((yield* repository.jobs.email.findById(persisted.emailJobId))?.status).toBe(
          "pending",
        );
        yield* application.auth.emailSignIn.verify({ ...proof, method: "magic_link" });
      }),
  );
  it.effect(
    "cleans expired proofs after the retention window while preserving audit and recent proofs",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        yield* completeTestBootstrap;
        const repository = yield* DatabaseRepository;
        const first = yield* requestEmailProof();
        yield* TestClock.adjust("1 day");
        expect(yield* repository.auth.verification.deleteExpiredBatch()).toBe(0);
        yield* TestClock.adjust("10 minutes");
        const recent = yield* requestEmailProof();
        expect(yield* repository.auth.verification.deleteExpiredBatch()).toBe(1);
        expect(yield* repository.auth.verification.findById(first.challengeId)).toBeUndefined();
        expect(yield* repository.auth.verification.findById(recent.challengeId)).toBeDefined();
        expect(
          yield* (yield* Database).query.auditEvent.findMany({
            where: { targetId: { eq: first.challengeId } },
          }),
        ).toHaveLength(1);
      }),
  );
});
