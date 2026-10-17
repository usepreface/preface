import { NodeCrypto } from "@effect/platform-node";
import { expect, layer } from "@effect/vitest";
import { Deferred, Effect, Fiber, Layer, Result } from "effect";
import { TestClock } from "effect/testing";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { NodeToken } from "../../../src/node/index.js";
import { RepositoryTestLayer } from "../../fixtures/application.js";
import { bootstrapInput } from "../../fixtures/bootstrap.js";
import { PasswordBarrier, PausedPasswordLayer } from "../../fixtures/password-barrier.js";

const AdmissionTestLayer = Application.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(PausedPasswordLayer, NodeToken.layer)),
  Layer.provide(NodeCrypto.layer),
  Layer.provideMerge(RepositoryTestLayer),
);

layer(AdmissionTestLayer)("bootstrap admission", (it) => {
  it.effect("allows replacement while hashing and rejects the previously admitted proof", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const bootstrap = (yield* Application).instance.bootstrap;
      const prepared = yield* bootstrap.prepare();
      if (prepared.state !== "issued") throw new Error("Expected a setup token");
      const barrier = yield* (yield* PasswordBarrier).arm;
      const completion = yield* Effect.forkChild(
        bootstrap.complete(yield* bootstrapInput(prepared.token)).pipe(Effect.result),
      );
      yield* Deferred.await(barrier.started);

      // This needs the installation lock. It would block if hashing held that lock.
      const replacement = yield* bootstrap.reissueToken();
      expect(replacement.state).toBe("issued");
      yield* Deferred.succeed(barrier.release, undefined);

      const outcome = yield* Fiber.join(completion);
      expect(Result.isFailure(outcome) && outcome.failure).toMatchObject({
        _tag: "BootstrapError",
        code: "INVALID_TOKEN",
      });
      expect(
        yield* (yield* DatabaseRepository).auth.user.findByEmail("owner@example.test"),
      ).toBeUndefined();
    }),
  );

  it.effect("checks expiry again after password hashing", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const bootstrap = (yield* Application).instance.bootstrap;
      const prepared = yield* bootstrap.prepare();
      if (prepared.state !== "issued") throw new Error("Expected a setup token");
      const barrier = yield* (yield* PasswordBarrier).arm;
      const completion = yield* Effect.forkChild(
        bootstrap.complete(yield* bootstrapInput(prepared.token)).pipe(Effect.result),
      );
      yield* Deferred.await(barrier.started);
      yield* TestClock.adjust("30 minutes");
      yield* Deferred.succeed(barrier.release, undefined);

      const outcome = yield* Fiber.join(completion);
      expect(Result.isFailure(outcome) && outcome.failure).toMatchObject({
        _tag: "BootstrapError",
        code: "INVALID_TOKEN",
      });
      expect(yield* (yield* DatabaseRepository).instance.owner.listActive()).toEqual([]);
    }),
  );
});
