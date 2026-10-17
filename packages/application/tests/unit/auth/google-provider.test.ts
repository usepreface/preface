import { Effect, Redacted } from "effect";

import { afterEach, describe, expect, it, vi } from "vitest";

import { GoogleIdentity } from "../../../src/auth/google/provider.js";
import { NodeGoogleIdentity } from "../../../src/node/index.js";
import { GoogleOidcFixture } from "../../fixtures/google-oidc.js";

const input = {
  clientId: "preface-client",
  clientSecret: Redacted.make("test-client-secret"),
  redirectUri: "https://preface.example.test/api/v1/auth/google/callback",
  code: Redacted.make("authorization-code"),
  state: Redacted.make("expected-state"),
  nonce: Redacted.make("expected-nonce"),
  verifier: Redacted.make("v".repeat(43)),
};
afterEach(() => vi.unstubAllGlobals());
describe("Google OIDC adapter", () => {
  it("validates a signed identity and exchanges the code with the bound verifier and fixed callback", async () => {
    const provider = new GoogleOidcFixture();
    vi.stubGlobal("fetch", provider.fetch);
    const identity = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* GoogleIdentity).exchangeAndVerify(input);
      }).pipe(Effect.provide(NodeGoogleIdentity.layer)),
    );
    expect(identity).toEqual({
      subject: "google-subject",
      email: "provider@example.test",
      emailVerified: true,
    });
    expect(provider.tokenParameters?.get("code_verifier")).toBe(Redacted.value(input.verifier));
    expect(provider.tokenParameters?.get("redirect_uri")).toBe(input.redirectUri);
  });
  it("rejects an otherwise signed token issued for another audience", async () => {
    const provider = new GoogleOidcFixture();
    provider.claims.aud = "another-client";
    vi.stubGlobal("fetch", provider.fetch);
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* GoogleIdentity).exchangeAndVerify(input).pipe(Effect.flip);
      }).pipe(Effect.provide(NodeGoogleIdentity.layer)),
    );
    expect(error).toMatchObject({ _tag: "IdentityError", code: "INVALID_FLOW" });
  });
  it("rejects an otherwise signed token with another flow nonce", async () => {
    const provider = new GoogleOidcFixture();
    provider.claims.nonce = "different-nonce";
    vi.stubGlobal("fetch", provider.fetch);
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* GoogleIdentity).exchangeAndVerify(input).pipe(Effect.flip);
      }).pipe(Effect.provide(NodeGoogleIdentity.layer)),
    );
    expect(error).toMatchObject({ _tag: "IdentityError", code: "INVALID_FLOW" });
  });
  it("rejects a token whose signature does not match Google's signing key", async () => {
    const provider = new GoogleOidcFixture();
    provider.tamperSignature = true;
    vi.stubGlobal("fetch", provider.fetch);
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* GoogleIdentity).exchangeAndVerify(input).pipe(Effect.flip);
      }).pipe(Effect.provide(NodeGoogleIdentity.layer)),
    );
    expect(error).toMatchObject({ _tag: "IdentityError", code: "INVALID_FLOW" });
  });
  it("maps an SDK-wrapped network failure to provider unavailability without exposing its cause", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("private network failure")));
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* (yield* GoogleIdentity).exchangeAndVerify(input).pipe(Effect.flip);
      }).pipe(Effect.provide(NodeGoogleIdentity.layer)),
    );
    expect(error).toMatchObject({ _tag: "IdentityError", code: "PROVIDER_UNAVAILABLE" });
    expect(JSON.stringify(error)).not.toContain("private network failure");
  });
});
