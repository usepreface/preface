import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Redacted } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { bootstrapInput, pendingSetupCode, verificationInput } from "../../fixtures/bootstrap.js";

layer(ApplicationTestLayer)("setup verification", (it) => {
  it.effect(
    "replaces codes after cooldown and invalidates them when the operator link changes",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const bootstrap = (yield* Application).instance.bootstrap;
        const repository = yield* DatabaseRepository;
        const prepared = yield* bootstrap.prepare();
        if (prepared.state !== "issued") throw new Error("Expected setup proof");
        const first = yield* verificationInput(prepared.token);
        const previous = yield* repository.instance.challenge.find();
        if (previous === undefined) throw new Error("Expected the pending challenge");
        expect(yield* bootstrap.resendVerification(first).pipe(Effect.flip)).toMatchObject({
          code: "VERIFICATION_RATE_LIMITED",
        });
        yield* TestClock.adjust("1 minute");
        const replacement = yield* bootstrap.resendVerification(first);
        const code = yield* pendingSetupCode;
        expect(yield* bootstrap.complete(first).pipe(Effect.flip)).toMatchObject({
          code: "INVALID_CODE",
        });
        expect((yield* repository.jobs.email.findById(previous.emailJobId))?.status).toBe(
          "cancelled",
        );
        yield* bootstrap.reissueToken();
        expect(
          yield* bootstrap
            .complete({ token: prepared.token, challengeId: replacement.challengeId, code })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_TOKEN" });
        expect(yield* repository.instance.challenge.find()).toBeUndefined();
        expect(yield* repository.instance.owner.listActive()).toEqual([]);
      }),
  );

  it.effect("commits failed attempts and prevents the correct code after five failures", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const bootstrap = (yield* Application).instance.bootstrap;
      const repository = yield* DatabaseRepository;
      const prepared = yield* bootstrap.prepare();
      if (prepared.state !== "issued") throw new Error("Expected setup proof");
      const input = yield* verificationInput(prepared.token);
      const wrong = {
        ...input,
        code: Redacted.make(Redacted.value(input.code) === "00000000" ? "11111111" : "00000000"),
      };
      // Concurrent requests must consume one shared database attempt budget.
      const failures = yield* Effect.all(
        Array.from({ length: 5 }, () => bootstrap.complete(wrong).pipe(Effect.flip)),
        { concurrency: 5 },
      );
      expect(failures).toEqual(
        Array(5).fill(expect.objectContaining({ _tag: "BootstrapError", code: "INVALID_CODE" })),
      );
      const challenge = yield* repository.instance.challenge.find();
      if (challenge === undefined) throw new Error("Expected the failed challenge");
      expect(challenge.attempts).toBe(5);
      expect((yield* repository.jobs.email.findById(challenge.emailJobId))?.status).toBe(
        "cancelled",
      );
      expect(yield* bootstrap.complete(input).pipe(Effect.flip)).toMatchObject({
        code: "INVALID_CODE",
      });
      const failuresRecorded = (yield* (yield* Database).query.auditEvent.findMany()).filter(
        (event) => event.eventType === "instance.bootstrap_verification_failed",
      );
      expect(failuresRecorded).toHaveLength(5);
      expect(yield* repository.auth.user.findByEmail("owner@example.test")).toBeUndefined();
    }),
  );

  it.effect("rejects expired verification even while the operator proof remains valid", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const bootstrap = (yield* Application).instance.bootstrap;
      const prepared = yield* bootstrap.prepare();
      if (prepared.state !== "issued") throw new Error("Expected setup proof");
      const input = yield* verificationInput(prepared.token);
      const challenge = yield* (yield* DatabaseRepository).instance.challenge.find();
      if (challenge === undefined) throw new Error("Expected pending verification");
      yield* TestClock.setTime(DateTime.toEpochMillis(challenge.expiresAt));
      expect(yield* bootstrap.complete(input).pipe(Effect.flip)).toMatchObject({
        code: "INVALID_CODE",
      });
      expect(yield* bootstrap.inspectToken(prepared.token)).toEqual({
        expiresAt: prepared.expiresAt,
      });
      const replacement = yield* bootstrap.requestVerification(
        yield* bootstrapInput(prepared.token),
      );
      expect(
        (yield* bootstrap.complete({
          token: prepared.token,
          challengeId: replacement.challengeId,
          code: yield* pendingSetupCode,
        })).actor.user.emailVerifiedAt,
      ).not.toBeNull();
    }),
  );
});
