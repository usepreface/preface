import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { DatabaseRepository } from "@usepreface/database";

import { completeTestSetup } from "../../fixtures/authenticated-user.js";
import { readEmailJob } from "../../fixtures/email-job.js";
import { HttpTestLayer } from "../../fixtures/http.js";

layer(HttpTestLayer, { excludeTestServices: true })(
  "Google administration and reauthentication HTTP",
  (it) => {
    it.effect(
      "keeps credentials private, requires a tested revision and binds the Google callback to its browser",
      () =>
        Effect.gen(function* () {
          const owner = yield* completeTestSetup;
          const api = yield* HttpApiClient.make(PrefaceApi, {
            transformClient: (client) =>
              HttpClient.mapRequest(
                client,
                HttpClientRequest.setHeaders({
                  origin: "https://preface.example.test",
                  cookie: `preface_session=${Redacted.value(owner.sessionToken)}`,
                }),
              ),
          });
          expect(yield* api.google.methods()).toEqual({ email: true, google: false });
          const config = yield* api.identityConnections.saveGoogle({
            payload: {
              expectedRevision: 0,
              clientId: "preface-client.apps.googleusercontent.com",
              clientSecret: "operator-secret",
            },
          });
          expect(config).toMatchObject({
            status: "draft",
            revision: 1,
            hasClientSecret: true,
            callbackUrl: "https://preface.example.test/api/v1/auth/google/callback",
          });
          expect(JSON.stringify(config)).not.toContain("operator-secret");
          expect(
            yield* api.identityConnections
              .activateGoogle({ payload: { expectedRevision: 1 } })
              .pipe(Effect.flip),
          ).toMatchObject({ _tag: "IdentityError", code: "CONNECTION_NOT_TESTED" });
          const [started, response] = yield* api.identityConnections.testGoogle({
            payload: { expectedRevision: 1 },
            responseMode: "decoded-and-response",
          });
          const url = new URL(started.authorizationUrl);
          expect(url.searchParams.get("code_challenge_method")).toBe("S256");
          expect(url.searchParams.get("scope")).toBe("openid email");
          expect(url.searchParams.has("client_secret")).toBe(false);
          expect(response.headers["set-cookie"]).toContain("HttpOnly");
          expect(response.headers["set-cookie"]).toContain("SameSite=Lax");
          const browserToken = response.cookies.cookies.preface_google_flow?.value;
          if (browserToken === undefined) throw new Error("Expected Google browser cookie");
          const state = url.searchParams.get("state");
          if (state === null) throw new Error("Expected OAuth state");
          expect(
            yield* api.google
              .callback({ query: { state, error: "access_denied" } })
              .pipe(Effect.flip),
          ).toMatchObject({ _tag: "IdentityError", code: "INVALID_FLOW" });
          const callback = yield* (yield* HttpClient.HttpClient).execute(
            HttpClientRequest.get("/api/v1/auth/google/callback").pipe(
              HttpClientRequest.setUrlParams({ state, error: "access_denied" }),
              HttpClientRequest.setHeader(
                "cookie",
                `preface_session=${Redacted.value(owner.sessionToken)}; preface_google_flow=${browserToken}`,
              ),
            ),
          );
          expect(callback.status).toBe(401);
          expect((yield* api.identityConnections.getGoogle()).status).toBe("draft");
        }),
    );
    it.effect(
      "delivers reauthentication proofs only by mail and a browser cookie and consumes them in the existing session",
      () =>
        Effect.gen(function* () {
          const owner = yield* completeTestSetup;
          const repository = yield* DatabaseRepository;
          const api = yield* HttpApiClient.make(PrefaceApi, {
            transformClient: (client) =>
              HttpClient.mapRequest(
                client,
                HttpClientRequest.setHeaders({
                  origin: "https://preface.example.test",
                  cookie: `preface_session=${Redacted.value(owner.sessionToken)}`,
                }),
              ),
          });
          const [challenge, response] = yield* api.reauthentication.requestEmail({
            payload: {},
            responseMode: "decoded-and-response",
          });
          expect(Object.keys(challenge)).toEqual(["challengeId", "expiresAt"]);
          const browserToken = response.cookies.cookies.preface_email_reauthentication?.value;
          if (browserToken === undefined)
            throw new Error("Expected reauthentication browser cookie");
          const stored = yield* repository.auth.verification.findById(challenge.challengeId);
          if (stored?.emailJobId === undefined || stored.emailJobId === null)
            throw new Error("Expected durable reauthentication job");
          const mail = yield* readEmailJob(stored.emailJobId);
          if (mail.type !== "email-reauthentication")
            throw new Error("Expected reauthentication payload");
          const payload = {
            challengeId: challenge.challengeId,
            method: "code" as const,
            code: mail.variables.code,
          };
          expect(
            yield* api.reauthentication.verifyEmail({ payload }).pipe(Effect.flip),
          ).toMatchObject({ _tag: "IdentityError", code: "INVALID_PROOF" });
          const bound = yield* HttpApiClient.make(PrefaceApi, {
            transformClient: (client) =>
              HttpClient.mapRequest(
                client,
                HttpClientRequest.setHeaders({
                  origin: "https://preface.example.test",
                  cookie: `preface_session=${Redacted.value(owner.sessionToken)}; preface_email_reauthentication=${browserToken}`,
                }),
              ),
          });
          const [, verified] = yield* bound.reauthentication.verifyEmail({
            payload,
            responseMode: "decoded-and-response",
          });
          expect(verified.status).toBe(204);
          expect(verified.headers["set-cookie"]).toContain("preface_email_reauthentication=");
          expect((yield* bound.session.current()).session.id).toBe(owner.actor.session.id);
        }),
    );
  },
);
