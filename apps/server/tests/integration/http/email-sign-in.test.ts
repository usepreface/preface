import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { DatabaseRepository } from "@usepreface/database";

import { completeTestSetup } from "../../fixtures/authenticated-user.js";
import { readEmailJob } from "../../fixtures/email-job.js";
import { HttpTestLayer } from "../../fixtures/http.js";

layer(HttpTestLayer, { excludeTestServices: true })("email sign-in HTTP boundary", (it) => {
  it.effect(
    "uses browser-bound proofs and cookie-only session delivery, then lists and revokes sessions",
    () =>
      Effect.gen(function* () {
        const first = yield* completeTestSetup;
        const application = yield* Application;
        const http = yield* HttpClient.HttpClient;
        const api = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            ),
        });
        const [challenge, requested] = yield* api.emailSignIn.request({
          payload: { email: " Owner@Example.Test " },
          responseMode: "decoded-and-response",
        });
        expect(Object.keys(challenge)).toEqual(["challengeId", "expiresAt"]);
        const browserToken = requested.cookies.cookies.preface_sign_in?.value;
        if (browserToken === undefined) throw new Error("Expected browser binding cookie");
        expect(requested.headers["set-cookie"]).toContain("HttpOnly");
        expect(requested.headers["set-cookie"]).toContain("Secure");
        expect(requested.headers["set-cookie"]).toContain("SameSite=Lax");
        const proof = yield* (yield* DatabaseRepository).auth.verification.findById(
          challenge.challengeId,
        );
        if (proof?.emailJobId === undefined || proof.emailJobId === null)
          throw new Error("Expected sign-in job");
        const email = yield* readEmailJob(proof.emailJobId);
        if (email.type !== "sign-in") throw new Error("Expected sign-in email");
        const payload = {
          challengeId: challenge.challengeId,
          method: "code",
          code: email.variables.code,
        };
        const noBinding = yield* http.execute(
          HttpClientRequest.post("/api/v1/auth/email/verify").pipe(
            HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            HttpClientRequest.bodyJsonUnsafe(payload),
          ),
        );
        expect(noBinding.status).toBe(401);
        expect(yield* noBinding.json).toEqual({ _tag: "EmailSignInError", code: "INVALID_PROOF" });
        const boundApi = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeaders({
                origin: "https://preface.example.test",
                cookie: `preface_sign_in=${browserToken}`,
              }),
            ),
        });
        const [actor, verified] = yield* boundApi.emailSignIn.verify({
          payload: { ...payload, method: "code" },
          responseMode: "decoded-and-response",
        });
        expect(actor.user).toEqual(first.actor.user);
        const sessionToken = verified.cookies.cookies.preface_session?.value;
        if (sessionToken === undefined) throw new Error("Expected session cookie");
        expect(verified.cookies.cookies.preface_sign_in?.value).toBe("");
        expect(JSON.stringify(actor)).not.toContain(sessionToken);
        const authenticatedApi = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeaders({
                origin: "https://preface.example.test",
                cookie: `preface_session=${sessionToken}`,
              }),
            ),
        });
        const sessions = yield* authenticatedApi.sessions.list({ query: { limit: 1 } });
        expect(sessions.sessions).toMatchObject([{ id: actor.session.id, isCurrent: true }]);
        const blocked = yield* authenticatedApi.emailSignIn
          .request({ payload: { email: "owner@example.test" } })
          .pipe(Effect.flip);
        expect(blocked).toMatchObject({ _tag: "EmailSignInError", code: "ALREADY_AUTHENTICATED" });
        const replay = yield* boundApi.emailSignIn
          .verify({ payload: { ...payload, method: "code" } })
          .pipe(Effect.flip);
        expect(replay).toMatchObject({ _tag: "EmailSignInError", code: "INVALID_PROOF" });
        yield* authenticatedApi.sessions.revokeAll();
        expect(
          yield* application.auth.session.resolve(Redacted.make(sessionToken)).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
        expect(
          yield* application.auth.session.resolve(first.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
      }),
  );
});
