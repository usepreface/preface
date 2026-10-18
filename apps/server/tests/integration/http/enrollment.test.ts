import { expect, layer } from "@effect/vitest";
import { Effect, Redacted, Schema } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { DatabaseRepository } from "@usepreface/database";
import { AuthFlowId } from "@usepreface/protocol";

import { completeTestSetup } from "../../fixtures/authenticated-user.js";
import { makeBackendTestLayer } from "../../fixtures/backend.js";
import { readEmailJob } from "../../fixtures/email-job.js";
import { makeHttpTestLayer } from "../../fixtures/http.js";
import { HttpOidcProvider } from "../../fixtures/oidc-provider.js";

layer(
  makeHttpTestLayer(
    makeBackendTestLayer(
      HttpOidcProvider,
      "https://preface.example.test",
      "https://dashboard.example.test",
    ),
  ),
  { excludeTestServices: true },
)("Invitation SSO HTTP", (it) => {
  it.effect(
    "continues an invited user's first SSO login through HttpOnly-bound email verification",
    () =>
      Effect.gen(function* () {
        const owner = yield* completeTestSetup;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const created = yield* application.organization.organization.create(owner.actor, {
          metadata: { name: "Knowledge" },
          slug: "knowledge",
        });
        const organizationId = created.organization.id;
        const connection = yield* application.organization.identityConnection.createOidc(
          owner.actor,
          organizationId,
          {
            name: "Company",
            issuer: "https://identity.example.test",
            clientId: "preface-client",
            clientSecret: Redacted.make("test-provider-secret"),
            clientAuthenticationMethod: "client_secret_basic",
          },
        );
        const testing = yield* application.organization.identityConnection.test(
          owner.actor,
          organizationId,
          connection.id,
          connection.revision,
        );
        yield* application.auth.oidc.callback(
          {
            state: Redacted.make(new URL(testing.authorizationUrl).searchParams.get("state") ?? ""),
            browserToken: testing.browserToken,
            code: Redacted.make("code"),
          },
          owner.actor,
        );
        yield* application.organization.identityConnection.activate(
          owner.actor,
          organizationId,
          connection.id,
          connection.revision,
        );
        yield* application.organization.authPolicy.update(owner.actor, organizationId, {
          expectedRevision: 1,
          oidcConnectionIds: [connection.id],
        });
        const role = yield* repository.organization.role.findByKey(organizationId, "member");
        if (role === undefined) throw new Error("Expected default member role");
        const invitation = yield* application.organization.invitation.create(
          owner.actor,
          organizationId,
          { email: "company@example.test", roleIds: [role.id] },
        );
        const stored = yield* repository.organization.invitation.findById(
          organizationId,
          invitation.id,
        );
        if (stored === undefined) throw new Error("Expected invitation");
        const email = yield* readEmailJob(stored.emailJobId);
        if (email.type !== "organization-invitation") throw new Error("Expected invitation email");
        const token = new URLSearchParams(new URL(email.variables.invitationUrl).hash.slice(1)).get(
          "token",
        );
        if (token === null) throw new Error("Expected invitation credential");

        const signedOut = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            ),
        });
        const preview = yield* signedOut.invitations.inspect({
          payload: { invitationId: invitation.id, token },
        });
        expect(preview.methods).toEqual([
          { connectionId: connection.id, provider: "oidc", name: "Company" },
        ]);
        const [started, response] = yield* signedOut.externalAuthentication.startInvitation({
          payload: {
            invitationId: invitation.id,
            token,
            connectionId: connection.id,
            displayName: "Company member",
          },
          responseMode: "decoded-and-response",
        });
        const browser = response.cookies.cookies.preface_oidc_flow?.value;
        if (browser === undefined) throw new Error("Expected provider flow cookie");
        const http = HttpClient.transformResponse(yield* HttpClient.HttpClient, (result) =>
          result.pipe(Effect.provideService(FetchHttpClient.RequestInit, { redirect: "manual" })),
        );
        const callback = yield* http.execute(
          HttpClientRequest.get("/api/v1/auth/oidc/callback").pipe(
            HttpClientRequest.setUrlParams({
              state: new URL(started.authorizationUrl).searchParams.get("state") ?? "",
              code: "code",
            }),
            HttpClientRequest.setHeader("cookie", `preface_oidc_flow=${browser}`),
          ),
        );
        expect(callback.status).toBe(303);
        expect(callback.headers.location).toMatch(
          /^https:\/\/dashboard\.example\.test\/auth\/verify-email\?flowId=/,
        );
        expect(callback.headers["set-cookie"]).toContain("HttpOnly");
        expect(callback.cookies.cookies.preface_session).toBeUndefined();
        const flowId = new URL(
          callback.headers.location ?? "",
          "https://preface.example.test",
        ).searchParams.get("flowId");
        const continuationCookie = callback.cookies.cookies.preface_external_flow?.value;
        if (flowId === null || continuationCookie === undefined)
          throw new Error("Expected browser continuation");
        const params = { flowId: yield* Schema.decodeUnknownEffect(AuthFlowId)(flowId) };
        expect(
          yield* signedOut.externalAuthentication.status({ params }).pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        const bound = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeaders({
                origin: "https://preface.example.test",
                cookie: `preface_external_flow=${continuationCookie}`,
              }),
            ),
        });
        expect((yield* bound.externalAuthentication.status({ params })).nextAction).toBe(
          "verify_email",
        );
        const challenge = yield* bound.externalAuthentication.requestEmail({
          params,
          payload: {},
        });
        const proof = yield* repository.auth.verification.findById(challenge.challengeId);
        if (proof?.emailJobId === null || proof?.emailJobId === undefined)
          throw new Error("Expected code email");
        const verificationEmail = yield* readEmailJob(proof.emailJobId);
        if (verificationEmail.type !== "identity-verification")
          throw new Error("Expected verification payload");
        const [completed, authenticated] = yield* bound.externalAuthentication.verifyEmail({
          params,
          payload: { challengeId: challenge.challengeId, code: verificationEmail.variables.code },
          responseMode: "decoded-and-response",
        });
        expect(completed.nextAction).toBe("continue");
        expect(completed.redirectTo).toBe("https://dashboard.example.test/");
        const session = authenticated.cookies.cookies.preface_session?.value;
        if (session === undefined) throw new Error("Expected session cookie after admission");
        const actor = yield* application.auth.session.resolve(Redacted.make(session));
        const invalidSaml = yield* http.execute(
          HttpClientRequest.post(`/api/v1/auth/saml/${connection.id}/acs`).pipe(
            HttpClientRequest.setHeader("origin", "https://identity.example.test"),
            HttpClientRequest.bodyUrlParams({
              RelayState: "unused-disposable-relay-state-credential-12345",
              SAMLResponse: "eA==",
            }),
          ),
        );
        expect(invalidSaml.status).toBe(303);
        expect(invalidSaml.headers.location).toBe(
          "https://dashboard.example.test/auth/error?code=INVALID_FLOW",
        );
        expect(invalidSaml.cookies.cookies.preface_session).toBeUndefined();
        expect(actor.user.email).toBe("company@example.test");
        expect(
          (yield* application.organization.organization.get(actor, organizationId)).organization.id,
        ).toBe(organizationId);
      }),
  );
});
