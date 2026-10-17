import { DateTime, Effect, Layer, Redacted } from "effect";

import { OidcIdentity } from "@usepreface/application";

// The HTTP suite exercises real Preface flows; external identity verification has its own SDK tests.
export const HttpOidcProvider = Layer.succeed(
  OidcIdentity,
  OidcIdentity.of({
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
    exchangeAndVerify: Effect.fnUntraced(function* (input) {
      yield* Effect.void;
      return {
        issuer: input.configuration.issuer,
        subject: "employee-42",
        email: "company@example.test",
        emailVerified: true,
        authenticatedAt: yield* DateTime.now,
      };
    }),
  }),
);
