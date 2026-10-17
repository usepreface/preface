import { Context, Deferred, Effect, Layer, Ref } from "effect";

import { PasswordService } from "../../src/index.js";
import { NodePassword } from "../../src/node/index.js";

const makePasswordBarrier = Effect.gen(function* () {
  const nextHash = yield* Ref.make<Effect.Effect<void>>(Effect.void);
  const arm = Effect.gen(function* () {
    const started = yield* Deferred.make<void>();
    const release = yield* Deferred.make<void>();
    yield* Ref.set(
      nextHash,
      Deferred.succeed(started, undefined).pipe(Effect.andThen(Deferred.await(release))),
    );
    return { started, release } as const;
  });
  return { arm, wait: Ref.getAndSet(nextHash, Effect.void).pipe(Effect.flatten) };
});

export class PasswordBarrier extends Context.Service<
  PasswordBarrier,
  Effect.Success<typeof makePasswordBarrier>
>()("@usepreface/application/tests/PasswordBarrier") {
  static readonly layer = Layer.effect(PasswordBarrier, makePasswordBarrier);
}

export const PausedPasswordLayer = Layer.effect(
  PasswordService,
  Effect.gen(function* () {
    const passwords = yield* PasswordService;
    const barrier = yield* PasswordBarrier;
    return PasswordService.of({
      ...passwords,
      hash: (password) => barrier.wait.pipe(Effect.andThen(passwords.hash(password))),
    });
  }),
).pipe(Layer.provide(NodePassword.layer), Layer.provideMerge(PasswordBarrier.layer));
