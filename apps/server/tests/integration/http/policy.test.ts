import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";

import { DatabaseRepository } from "@usepreface/database";

import { prepareTestInstance } from "../../fixtures/backend.js";
import { HttpTestLayer } from "../../fixtures/http.js";

layer(HttpTestLayer, { excludeTestServices: true })("HTTP request policy", (it) => {
  it.effect(
    "rejects untrusted mutations, sanitizes malformed input and limits request bodies",
    () =>
      Effect.gen(function* () {
        const prepared = yield* prepareTestInstance;
        const http = yield* HttpClient.HttpClient;
        const payload = {
          token: Redacted.value(prepared.token),
          organizationName: "Preface",
          ownerName: "Owner",
          email: "owner@example.test",
        };

        const rejected = yield* http.execute(
          HttpClientRequest.post("/api/v1/instance/setup").pipe(
            HttpClientRequest.setHeader("origin", "https://attacker.example"),
            HttpClientRequest.bodyJsonUnsafe(payload),
          ),
        );
        expect(rejected.status).toBe(403);
        expect(yield* rejected.json).toEqual({ _tag: "RequestError", code: "FORBIDDEN" });
        expect(rejected.headers["cache-control"]).toBe("no-store");
        expect(rejected.headers["x-content-type-options"]).toBe("nosniff");
        expect(rejected.headers["x-request-id"]).toBeDefined();
        expect(rejected.headers["access-control-allow-origin"]).toBeUndefined();
        expect(rejected.headers["set-cookie"]).toBeUndefined();
        expect(
          yield* (yield* DatabaseRepository).auth.userEmail.findActiveByEmail(payload.email),
        ).toBeUndefined();

        const missingOrigin = yield* http.del("/api/v1/auth/session");
        expect(missingOrigin.status).toBe(403);

        const invalid = yield* http.execute(
          HttpClientRequest.post("/api/v1/instance/setup").pipe(
            HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            HttpClientRequest.bodyJsonUnsafe({
              ...payload,
              email: "sensitive-invalid-email",
            }),
          ),
        );
        expect(invalid.status).toBe(400);
        expect(yield* invalid.text).toBe('{"_tag":"RequestError","code":"INVALID_INPUT"}');
        expect(invalid.headers["access-control-allow-origin"]).toBe("https://preface.example.test");

        const malformed = yield* http.execute(
          HttpClientRequest.post("/api/v1/instance/setup/inspect").pipe(
            HttpClientRequest.setHeaders({
              origin: "https://preface.example.test",
              "content-type": "application/json",
            }),
            HttpClientRequest.bodyText('{"token":"secret-malformed-value"', "application/json"),
          ),
        );
        expect(malformed.status).toBe(400);
        expect(yield* malformed.json).toEqual({ _tag: "RequestError", code: "INVALID_INPUT" });

        const oversized = yield* http.execute(
          HttpClientRequest.post("/api/v1/instance/setup/inspect").pipe(
            HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            HttpClientRequest.bodyJsonUnsafe({ token: "sensitive".repeat(5000) }),
          ),
        );
        expect(oversized.status).toBe(413);
        expect(oversized.headers["cache-control"]).toBe("no-store");
        expect(oversized.headers["x-request-id"]).toBeDefined();

        const unsupported = yield* http.execute(
          HttpClientRequest.post("/api/v1/instance/setup/inspect").pipe(
            HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            HttpClientRequest.bodyText("sensitive-form-value"),
          ),
        );
        expect(unsupported.status).toBe(415);

        const preflight = yield* http.execute(
          HttpClientRequest.options("/api/v1/instance/setup").pipe(
            HttpClientRequest.setHeaders({
              origin: "https://preface.example.test",
              "access-control-request-method": "POST",
              "access-control-request-headers": "content-type",
            }),
          ),
        );
        expect(preflight.status).toBe(204);
        expect(preflight.headers["access-control-allow-origin"]).toBe(
          "https://preface.example.test",
        );
        expect(preflight.headers["access-control-allow-credentials"]).toBe("true");
        expect(preflight.headers["x-content-type-options"]).toBe("nosniff");
      }),
  );

  it.effect(
    "serves healthy onboarding, a matching OpenAPI document and self-contained Scalar with CSP",
    () =>
      Effect.gen(function* () {
        yield* prepareTestInstance;
        const http = yield* HttpClient.HttpClient;
        expect((yield* http.get("/health/live")).status).toBe(200);
        expect((yield* http.get("/health/ready")).status).toBe(200);

        const document = yield* http.get("/api/openapi.json");
        expect(document.status).toBe(200);
        expect(yield* document.json).toMatchObject({
          info: { title: "Preface API" },
          paths: { "/api/v1/auth/session": expect.any(Object) },
        });
        const docs = yield* http.get("/api/docs");
        expect(docs.status).toBe(200);
        const html = yield* docs.text;
        expect(html).toContain("Scalar.createApiReference");
        expect(html).not.toContain('<script src="https://');
        expect(docs.headers["content-security-policy"]).toContain("script-src 'sha256-");
        expect(docs.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
        expect(docs.headers["x-robots-tag"]).toBe("noindex, nofollow");

        const absent = yield* http.get("/api/v1/instance/setup/reissue?token=never-log-this");
        expect(absent.status).toBe(404);
        expect(yield* absent.json).toEqual({ _tag: "RequestError", code: "NOT_FOUND" });
      }),
  );
  it.effect(
    "enforces setup throttling through the matched endpoint and returns retry metadata",
    () =>
      Effect.gen(function* () {
        yield* prepareTestInstance;
        const http = yield* HttpClient.HttpClient;
        const responses = yield* Effect.forEach(Array.from({ length: 31 }), () =>
          http.execute(
            HttpClientRequest.post("/api/v1/instance/setup/inspect").pipe(
              HttpClientRequest.setHeader("origin", "https://preface.example.test"),
              HttpClientRequest.bodyJsonUnsafe({ token: "invalid-proof" }),
            ),
          ),
        );
        const blocked = responses.at(-1);
        if (blocked === undefined) throw new Error("Expected an inspection response");
        expect(blocked.status).toBe(429);
        expect(yield* blocked.json).toEqual({ _tag: "RequestError", code: "RATE_LIMITED" });
        expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
        expect(blocked.headers["cache-control"]).toBe("no-store");
        expect(blocked.headers["x-request-id"]).toBeDefined();

        const alternative = yield* http.execute(
          HttpClientRequest.post("/api/v1/instance/%73etup/inspect").pipe(
            HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            HttpClientRequest.bodyJsonUnsafe({ token: "invalid-proof" }),
          ),
        );
        expect([404, 429]).toContain(alternative.status);
      }),
  );
});
