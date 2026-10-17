import { Context, Effect, Layer, Ref, Redacted } from "effect";

import { OidcIdentity, type OidcIdentityClaims } from "../../src/auth/oidc/provider.js";

const makeTestOidc = Effect.gen(function* () {
  const identity = yield* Ref.make<OidcIdentityClaims>({
    issuer: "https://identity.example.test",
    subject: "operator-oidc",
    email: "claim@example.test",
    emailVerified: true,
  });
  const gate = yield* Ref.make<Effect.Effect<void>>(Effect.void);
  const calls = yield* Ref.make(0);
  return { identity, gate, calls };
});
export class TestOidc extends Context.Service<TestOidc, Effect.Success<typeof makeTestOidc>>()(
  "TestOidc",
) {
  static readonly layer = Layer.effect(TestOidc, makeTestOidc);
}
export const OidcTestProvider = Layer.effect(
  OidcIdentity,
  Effect.gen(function* () {
    const test = yield* TestOidc;
    return OidcIdentity.of({
      discover: Effect.fnUntraced(function* (input) {
        yield* Effect.void;
        return {
          ...input,
          version: 1,
          idTokenSigningAlgorithm: "RS256",
          metadata: {
            authorizationEndpoint: `${input.issuer}/authorize`,
            tokenEndpoint: `${input.issuer}/token`,
            jwksUri: `${input.issuer}/jwks`,
          },
        };
      }),
      authorizationUrl: Effect.fnUntraced(function* (input) {
        yield* Effect.void;
        const url = new URL(input.configuration.metadata.authorizationEndpoint);
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
).pipe(Layer.provideMerge(TestOidc.layer));
