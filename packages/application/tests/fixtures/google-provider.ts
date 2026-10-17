import { Context, Effect, Layer, Ref, Redacted } from "effect";

import { GoogleIdentity, type GoogleIdentityClaims } from "../../src/auth/google/provider.js";

const makeTestGoogle = Effect.gen(function* () {
  const identity = yield* Ref.make<GoogleIdentityClaims>({
    subject: "operator-google",
    email: "operator@google.example",
    emailVerified: true,
  });
  const gate = yield* Ref.make<Effect.Effect<void>>(Effect.void);
  const calls = yield* Ref.make(0);
  return { identity, gate, calls };
});
export class TestGoogle extends Context.Service<
  TestGoogle,
  Effect.Success<typeof makeTestGoogle>
>()("TestGoogle") {
  static readonly layer = Layer.effect(TestGoogle, makeTestGoogle);
}
export const GoogleTestProvider = Layer.effect(
  GoogleIdentity,
  Effect.gen(function* () {
    const test = yield* TestGoogle;
    return GoogleIdentity.of({
      authorizationUrl: Effect.fnUntraced(function* (input) {
        yield* Effect.void;
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        url.searchParams.set("state", Redacted.value(input.state));
        url.searchParams.set("nonce", Redacted.value(input.nonce));
        return url.href;
      }),
      exchangeAndVerify: Effect.fnUntraced(function* () {
        yield* Ref.update(test.calls, (count) => count + 1);
        yield* yield* Ref.get(test.gate);
        return yield* Ref.get(test.identity);
      }),
    });
  }),
).pipe(Layer.provideMerge(TestGoogle.layer));
