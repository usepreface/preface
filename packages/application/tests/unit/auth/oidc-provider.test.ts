import { DateTime, Effect, Layer, Redacted } from "effect";

import { describe, expect, it } from "vitest";

import { OidcIdentity } from "../../../src/auth/oidc/provider.js";
import { NodeOidcIdentity } from "../../../src/node/oidc.js";
import { OidcHttp } from "../../../src/node/oidc/http.js";
import { OidcIssuerFixture } from "../../fixtures/oidc-issuer.js";

const input = {
  issuer: "https://identity.example.test",
  clientId: "preface-client",
  clientAuthenticationMethod: "client_secret_basic" as const,
};
const proof = {
  clientSecret: Redacted.make("fixture-client-secret"),
  redirectUri: "https://preface.example.test/api/v1/auth/oidc/callback",
  code: Redacted.make("authorization-code"),
  state: Redacted.make("expected-state"),
  nonce: Redacted.make("expected-nonce"),
  verifier: Redacted.make("v".repeat(43)),
  reauthenticate: false,
};
describe("OIDC SDK adapter", () => {
  it("discovers a provider and validates a signed identity with explicit client authentication and PKCE", async () => {
    const issuer = new OidcIssuerFixture();
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    issuer.claims.exp = expiresAt;
    const identity = await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* OidcIdentity;
        const configuration = yield* provider.discover(input);
        return yield* provider.exchangeAndVerify({ ...proof, configuration });
      }).pipe(
        Effect.provide(NodeOidcIdentity.layerWithTransport),
        Effect.provide(Layer.succeed(OidcHttp, { fetch: issuer.fetch, checkUrl: async () => {} })),
      ),
    );
    expect(identity).toEqual({
      issuer: issuer.issuer,
      subject: "employee-42",
      email: "provider@example.test",
      emailVerified: true,
      authenticatedAt: null,
      validUntil: DateTime.makeUnsafe(expiresAt * 1000),
    });
    expect(issuer.tokenParameters?.get("code_verifier")).toBe(Redacted.value(proof.verifier));
    expect(issuer.tokenParameters?.get("redirect_uri")).toBe(proof.redirectUri);
    expect(issuer.tokenAuthorization).toMatch(/^Basic /);
    expect(issuer.tokenParameters?.has("client_secret")).toBe(false);
  });
  it("rejects discovery from a different issuer", async () => {
    const issuer = new OidcIssuerFixture();
    issuer.metadata.issuer = "https://different.example.test";
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* OidcIdentity).discover(input).pipe(Effect.flip);
      }).pipe(
        Effect.provide(NodeOidcIdentity.layerWithTransport),
        Effect.provide(Layer.succeed(OidcHttp, { fetch: issuer.fetch, checkUrl: async () => {} })),
      ),
    );
    expect(error).toMatchObject({ code: "INVALID_CONFIGURATION" });
  });
  it("rejects a correctly signed token intended for another client", async () => {
    const issuer = new OidcIssuerFixture();
    issuer.claims.aud = "another-client";
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* OidcIdentity;
        return yield* provider
          .exchangeAndVerify({ ...proof, configuration: yield* provider.discover(input) })
          .pipe(Effect.flip);
      }).pipe(
        Effect.provide(NodeOidcIdentity.layerWithTransport),
        Effect.provide(Layer.succeed(OidcHttp, { fetch: issuer.fetch, checkUrl: async () => {} })),
      ),
    );
    expect(error).toMatchObject({ code: "INVALID_FLOW" });
  });
  it("rejects a correctly signed token from another browser transaction", async () => {
    const issuer = new OidcIssuerFixture();
    issuer.claims.nonce = "another-nonce";
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* OidcIdentity;
        return yield* provider
          .exchangeAndVerify({ ...proof, configuration: yield* provider.discover(input) })
          .pipe(Effect.flip);
      }).pipe(
        Effect.provide(NodeOidcIdentity.layerWithTransport),
        Effect.provide(Layer.succeed(OidcHttp, { fetch: issuer.fetch, checkUrl: async () => {} })),
      ),
    );
    expect(error).toMatchObject({ code: "INVALID_FLOW" });
  });
  it("rejects a token whose signature was changed", async () => {
    const issuer = new OidcIssuerFixture();
    issuer.tamperSignature = true;
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* OidcIdentity;
        return yield* provider
          .exchangeAndVerify({ ...proof, configuration: yield* provider.discover(input) })
          .pipe(Effect.flip);
      }).pipe(
        Effect.provide(NodeOidcIdentity.layerWithTransport),
        Effect.provide(Layer.succeed(OidcHttp, { fetch: issuer.fetch, checkUrl: async () => {} })),
      ),
    );
    expect(error).toMatchObject({ code: "INVALID_FLOW" });
  });
  it("requires fresh provider authentication for reauthentication rather than accepting an old provider session", async () => {
    const issuer = new OidcIssuerFixture();
    issuer.claims.auth_time = Math.floor(Date.now() / 1000) - 600;
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* OidcIdentity;
        const configuration = yield* provider.discover(input);
        const url = yield* provider.authorizationUrl({
          ...proof,
          configuration,
          reauthenticate: true,
          codeChallenge: "challenge",
        });
        expect(new URL(url).searchParams.get("max_age")).toBe("0");
        return yield* provider
          .exchangeAndVerify({ ...proof, configuration, reauthenticate: true })
          .pipe(Effect.flip);
      }).pipe(
        Effect.provide(NodeOidcIdentity.layerWithTransport),
        Effect.provide(Layer.succeed(OidcHttp, { fetch: issuer.fetch, checkUrl: async () => {} })),
      ),
    );
    expect(error).toMatchObject({ code: "INVALID_FLOW" });
  });
  it("requests the persisted maximum age and retains the signed provider authentication time", async () => {
    const issuer = new OidcIssuerFixture();
    const providerTime = Math.floor(Date.now() / 1000) - 120;
    issuer.claims.auth_time = providerTime;
    const identity = await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* OidcIdentity;
        const configuration = yield* provider.discover(input);
        const url = yield* provider.authorizationUrl({
          ...proof,
          configuration,
          codeChallenge: "challenge",
          maxAgeSeconds: 300,
        });
        expect(new URL(url).searchParams.get("max_age")).toBe("300");
        return yield* provider.exchangeAndVerify({ ...proof, configuration, maxAgeSeconds: 300 });
      }).pipe(
        Effect.provide(NodeOidcIdentity.layerWithTransport),
        Effect.provide(Layer.succeed(OidcHttp, { fetch: issuer.fetch, checkUrl: async () => {} })),
      ),
    );
    expect(
      identity.authenticatedAt === null || identity.authenticatedAt === undefined
        ? null
        : DateTime.toEpochMillis(identity.authenticatedAt),
    ).toBe(providerTime * 1000);
  });
  it("rejects a signed token missing authentication time when a maximum age was requested", async () => {
    const issuer = new OidcIssuerFixture();
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const provider = yield* OidcIdentity;
        return yield* provider
          .exchangeAndVerify({
            ...proof,
            configuration: yield* provider.discover(input),
            maxAgeSeconds: 300,
          })
          .pipe(Effect.flip);
      }).pipe(
        Effect.provide(NodeOidcIdentity.layerWithTransport),
        Effect.provide(Layer.succeed(OidcHttp, { fetch: issuer.fetch, checkUrl: async () => {} })),
      ),
    );
    expect(error).toMatchObject({ code: "INVALID_FLOW" });
  });
  it("preserves an unexpected adapter defect instead of reporting a normal login rejection", async () => {
    const program = Effect.gen(function* () {
      return yield* (yield* OidcIdentity).discover(input);
    }).pipe(
      Effect.provide(NodeOidcIdentity.layerWithTransport),
      Effect.provide(
        Layer.succeed(OidcHttp, {
          fetch: async () => {
            throw new ReferenceError("unexpected adapter defect");
          },
          checkUrl: async () => {},
        }),
      ),
    );
    await expect(Effect.runPromise(program)).rejects.toThrow("unexpected adapter defect");
  });
});
