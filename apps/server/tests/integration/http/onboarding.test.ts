import { expect, layer } from "@effect/vitest";
import { Effect, Redacted, Schema } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { SessionActor } from "@usepreface/protocol/dto";

import { prepareTestInstance } from "../../fixtures/backend.js";
import { HttpTestLayer } from "../../fixtures/http.js";
import { pendingSetupCode } from "../../fixtures/setup-code.js";

layer(HttpTestLayer, { excludeTestServices: true })("onboarding HTTP boundary", (it) => {
  it.effect(
    "accepts a typed client request, sets only a cookie credential and enforces session/logout",
    () =>
      Effect.gen(function* () {
        const prepared = yield* prepareTestInstance;
        const http = yield* HttpClient.HttpClient;
        const api = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            ),
        });
        expect(yield* api.instanceSetup.status()).toMatchObject({ state: "setup_required" });
        const inspected = yield* api.instanceSetup.inspect({
          payload: { token: Redacted.value(prepared.token) },
        });
        expect(inspected.expiresAt).toEqual(prepared.expiresAt);

        const [verification, requestedResponse] = yield* api.instanceSetup.requestVerification({
          payload: {
            token: Redacted.value(prepared.token),
            organizationName: "Knowledge",
            ownerName: " Owner ",
            email: " Owner@Example.Test ",
          },
          responseMode: "decoded-and-response",
        });
        expect(requestedResponse.status).toBe(202);
        expect(requestedResponse.headers["set-cookie"]).toBeUndefined();
        const cooldown = yield* http.execute(
          HttpClientRequest.post("/api/v1/instance/setup/resend").pipe(
            HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            HttpClientRequest.bodyJsonUnsafe({
              token: Redacted.value(prepared.token),
              challengeId: verification.challengeId,
            }),
          ),
        );
        expect(cooldown.status).toBe(429);
        expect(cooldown.headers["retry-after"]).toBe("60");
        expect(yield* cooldown.json).toEqual({
          _tag: "BootstrapError",
          code: "VERIFICATION_RATE_LIMITED",
        });
        const [actor, completedResponse] = yield* api.instanceSetup.complete({
          payload: {
            token: Redacted.value(prepared.token),
            challengeId: verification.challengeId,
            code: Redacted.value(yield* pendingSetupCode),
          },
          responseMode: "decoded-and-response",
        });
        expect(completedResponse.status).toBe(201);
        const completed = Schema.encodeSync(SessionActor)(actor);
        expect(completed).toMatchObject({
          user: {
            email: "owner@example.test",
            metadata: { version: 1, name: "Owner" },
            emailVerifiedAt: expect.any(String),
          },
          session: { expiresAt: expect.any(String) },
        });
        expect(Object.keys(completed)).toEqual(["user", "session"]);
        const cookie = completedResponse.headers["set-cookie"];
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("Secure");
        expect(completedResponse.headers["strict-transport-security"]).toBe("max-age=31536000");
        expect(cookie).toContain("SameSite=Lax");
        expect(cookie).toContain("Path=/");
        expect(cookie).not.toContain("Domain=");
        if (cookie === undefined) throw new Error("Expected the session cookie");
        const credential = cookie.split(";", 1)[0];
        if (credential === undefined) throw new Error("Expected the session cookie value");
        expect(JSON.stringify(completed)).not.toContain(
          credential.slice(credential.indexOf("=") + 1),
        );

        const current = yield* http.get("/api/v1/auth/session", {
          headers: { cookie: credential },
        });
        expect(current.status).toBe(200);
        expect(yield* current.json).toEqual(completed);

        const logout = yield* http.del("/api/v1/auth/session", {
          headers: { cookie: credential, origin: "https://preface.example.test" },
        });
        expect(logout.status).toBe(204);
        expect(logout.headers["set-cookie"]).toContain("Max-Age=0");
        const unauthorized = yield* http.get("/api/v1/auth/session", {
          headers: { cookie: credential },
        });
        expect(unauthorized.status).toBe(401);
        expect(yield* unauthorized.json).toEqual({
          _tag: "AuthenticationError",
          code: "UNAUTHENTICATED",
        });
        expect(
          (yield* http.del("/api/v1/auth/session", {
            headers: { origin: "https://preface.example.test" },
          })).status,
        ).toBe(204);
      }),
  );
});
