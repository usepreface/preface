import { expect, layer } from "@effect/vitest";
import { Deferred, Effect, Fiber, Ref } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";
import { TestGoogle } from "../../fixtures/google-provider.js";
import { configureTestGoogle, googleCallbackInput, linkTestGoogle } from "../../fixtures/google.js";

layer(ApplicationTestLayer)("Google atomicity and revocation", (it) => {
  it.effect(
    "rolls back linking when required audit fails and prevents the failed flow from being replayed",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const owner = yield* completeTestBootstrap;
        yield* configureTestGoogle(owner.actor);
        const started = yield* application.auth.account.startGoogle(owner.actor);
        const input = yield* googleCallbackInput(started);
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.auth.google.callback(input, owner.actor).pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
        expect(
          yield* application.auth.google.callback(input, owner.actor).pipe(Effect.flip),
        ).toMatchObject({ _tag: "IdentityError", code: "INVALID_FLOW" });
      }),
  );
  it.effect(
    "observes disablement committed while an authorization-code exchange is in flight",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const owner = yield* completeTestBootstrap;
        const config = yield* configureTestGoogle(owner.actor);
        const provider = yield* TestGoogle;
        const exchanging = yield* Deferred.make<void>();
        const resume = yield* Deferred.make<void>();
        yield* Ref.set(
          provider.gate,
          Deferred.succeed(exchanging, undefined).pipe(Effect.andThen(Deferred.await(resume))),
        );
        const started = yield* application.auth.account.startGoogle(owner.actor);
        const input = yield* googleCallbackInput(started);
        const callback = yield* application.auth.google
          .callback(input, owner.actor)
          .pipe(Effect.result, Effect.forkChild);
        yield* Deferred.await(exchanging);
        yield* application.instance.authentication.google.disable(owner.actor, config.revision);
        yield* Deferred.succeed(resume, undefined);
        expect(yield* Fiber.join(callback)).toMatchObject({
          _tag: "Failure",
          failure: { _tag: "IdentityError", code: "CONNECTION_UNAVAILABLE" },
        });
        expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
      }),
  );
  it.effect("does not recreate Google evidence when the account is unlinked during exchange", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const owner = yield* completeTestBootstrap;
      yield* configureTestGoogle(owner.actor);
      const account = yield* linkTestGoogle(owner.actor);
      const provider = yield* TestGoogle;
      const exchanging = yield* Deferred.make<void>();
      const resume = yield* Deferred.make<void>();
      yield* Ref.set(
        provider.gate,
        Deferred.succeed(exchanging, undefined).pipe(Effect.andThen(Deferred.await(resume))),
      );
      const started = yield* application.auth.google.start();
      const callback = yield* application.auth.google
        .callback(yield* googleCallbackInput(started))
        .pipe(Effect.result, Effect.forkChild);
      yield* Deferred.await(exchanging);
      yield* application.auth.account.unlink(owner.actor, account.id);
      yield* Deferred.succeed(resume, undefined);
      expect(yield* Fiber.join(callback)).toMatchObject({
        _tag: "Failure",
        failure: { _tag: "IdentityError", code: "IDENTITY_NOT_LINKED" },
      });
      expect((yield* repository.auth.account.findById(account.id))?.unlinkedAt).not.toBeNull();
    }),
  );
});
