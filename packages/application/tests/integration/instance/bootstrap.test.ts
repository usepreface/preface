import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Redacted, Result } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { bootstrapInput, pendingSetupCode, verificationInput } from "../../fixtures/bootstrap.js";

layer(ApplicationTestLayer)("instance bootstrap", (it) => {
  it.effect("preserves a pending link on restart and invalidates replaced and expired links", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const bootstrap = (yield* Application).instance.bootstrap;
      const preparations = yield* Effect.all([bootstrap.prepare(), bootstrap.prepare()], {
        concurrency: 2,
      });
      const first = preparations.find((prepared) => prepared.state === "issued");
      if (first === undefined) throw new Error("Expected the initial setup token");
      expect(preparations.filter((prepared) => prepared.state === "issued")).toHaveLength(1);
      expect(preparations.find((prepared) => prepared.state === "pending")).toEqual({
        state: "pending",
        expiresAt: first.expiresAt,
      });
      const identity = (yield* (yield* DatabaseRepository).instance.installation.find())
        ?.installationId;

      expect(yield* bootstrap.prepare()).toEqual({ state: "pending", expiresAt: first.expiresAt });
      expect(yield* bootstrap.inspectToken(first.token)).toEqual({ expiresAt: first.expiresAt });
      const replacement = yield* bootstrap.reissueToken();
      if (replacement.state !== "issued") throw new Error("Expected a replacement setup token");
      expect(yield* bootstrap.inspectToken(first.token).pipe(Effect.flip)).toMatchObject({
        _tag: "BootstrapError",
        code: "INVALID_TOKEN",
      });

      yield* TestClock.setTime(DateTime.toEpochMillis(replacement.expiresAt));
      expect(
        yield* bootstrap
          .requestVerification(yield* bootstrapInput(replacement.token))
          .pipe(Effect.flip),
      ).toMatchObject({ _tag: "BootstrapError", code: "INVALID_TOKEN" });
      const renewed = yield* bootstrap.prepare();
      expect(renewed.state).toBe("issued");
      expect(
        (yield* (yield* DatabaseRepository).instance.installation.find())?.installationId,
      ).toBe(identity);
      expect(yield* (yield* DatabaseRepository).instance.owner.listActive()).toEqual([]);
    }),
  );

  it.effect(
    "completes setup exactly once with safe identity, credentials, and required audit rows",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const prepared = yield* application.instance.bootstrap.prepare();
        if (prepared.state !== "issued") throw new Error("Expected the setup token");
        const details = yield* bootstrapInput(prepared.token, {
          email: " Owner@Example.Test ",
          ownerName: " First Owner ",
          instanceName: " Knowledge ",
        });

        const verification = yield* application.instance.bootstrap.requestVerification(details);
        const input = {
          token: prepared.token,
          challengeId: verification.challengeId,
          code: yield* pendingSetupCode,
        };

        const outcomes = yield* Effect.all(
          [
            application.instance.bootstrap.complete(input).pipe(Effect.result),
            application.instance.bootstrap.complete(input).pipe(Effect.result),
          ],
          { concurrency: 2 },
        );
        const success = outcomes.find(Result.isSuccess);
        const failure = outcomes.find(Result.isFailure);
        if (success === undefined || failure === undefined)
          throw new Error("Expected exactly one successful completion");
        expect(failure.failure).toMatchObject({
          _tag: "BootstrapError",
          code: "ALREADY_COMPLETED",
        });

        const completed = success.success;
        expect(completed.actor.user).toEqual({
          id: completed.actor.user.id,
          displayName: "First Owner",
          email: "owner@example.test",
          emailVerifiedAt: expect.anything(),
        });
        expect(Object.keys(completed.actor.session)).toEqual(["id", "expiresAt"]);
        expect(yield* application.auth.session.resolve(completed.sessionToken)).toEqual(
          completed.actor,
        );
        expect(yield* application.instance.bootstrap.getStatus()).toEqual({
          state: "ready",
          instanceName: "Knowledge",
        });
        expect(yield* application.instance.bootstrap.prepare()).toEqual({ state: "ready" });
        expect(
          yield* application.instance.bootstrap.reissueToken().pipe(Effect.flip),
        ).toMatchObject({ _tag: "BootstrapError", code: "ALREADY_COMPLETED" });
        expect(
          yield* application.instance.bootstrap.complete(input).pipe(Effect.flip),
        ).toMatchObject({ _tag: "BootstrapError", code: "ALREADY_COMPLETED" });

        const installation = yield* repository.instance.installation.find();
        expect(installation?.bootstrapTokenHash).toBeNull();
        const owner = yield* repository.instance.owner.listActive();
        expect(owner).toHaveLength(1);
        expect(owner[0]?.userId).toBe(completed.actor.user.id);
        const rows = yield* database.query.session.findMany();
        expect(rows).toHaveLength(1);
        expect(rows[0]?.tokenHash).not.toBe(Redacted.value(completed.sessionToken));
        const events = yield* database.query.auditEvent.findMany();
        expect(events.map((event) => event.eventType).toSorted()).toEqual([
          "auth.email_verified",
          "auth.session_authenticated",
          "auth.session_created",
          "instance.bootstrap_completed",
          "instance.bootstrap_token_issued",
          "instance.bootstrap_verification_requested",
          "instance.owner_granted",
        ]);
      }),
  );

  it.effect("rolls back the challenge and email intent when required audit fails", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const bootstrap = (yield* Application).instance.bootstrap;
      const prepared = yield* bootstrap.prepare();
      if (prepared.state !== "issued") throw new Error("Expected setup proof");
      const input = yield* bootstrapInput(prepared.token);
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* rejectLifecycleAudit;
          expect(yield* bootstrap.requestVerification(input).pipe(Effect.flip)).toMatchObject({
            _tag: "DatabaseError",
          });
        }),
      );
      expect(yield* (yield* DatabaseRepository).instance.challenge.find()).toBeUndefined();
      expect(yield* (yield* Database).$client`select id from jobs.email`).toEqual([]);
      yield* bootstrap.requestVerification(input);
    }),
  );

  it.effect("rolls back the entire completion when the final required audit insert fails", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const database = yield* Database;
      const prepared = yield* application.instance.bootstrap.prepare();
      if (prepared.state !== "issued") throw new Error("Expected the setup token");
      const input = yield* verificationInput(prepared.token);
      const before = yield* application.instance.bootstrap.getStatus();

      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* rejectLifecycleAudit;
          expect(
            yield* application.instance.bootstrap.complete(input).pipe(Effect.flip),
          ).toMatchObject({ _tag: "DatabaseError" });
        }),
      );

      expect(yield* application.instance.bootstrap.getStatus()).toEqual(before);
      expect(yield* repository.instance.owner.listActive()).toEqual([]);
      expect(yield* database.query.user.findMany()).toEqual([]);
      expect(yield* database.query.userEmail.findMany()).toEqual([]);
      expect(yield* database.query.session.findMany()).toEqual([]);
      expect((yield* database.query.auditEvent.findMany()).map((event) => event.eventType)).toEqual(
        ["instance.bootstrap_token_issued", "instance.bootstrap_verification_requested"],
      );
      expect(yield* application.instance.bootstrap.inspectToken(prepared.token)).toEqual({
        expiresAt: prepared.expiresAt,
      });
      expect((yield* application.instance.bootstrap.complete(input)).actor.user.email).toBe(
        "owner@example.test",
      );
    }),
  );
});
