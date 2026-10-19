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

layer(HttpTestLayer, { excludeTestServices: true })("invitation HTTP boundary", (it) => {
  it.effect(
    "delivers credentials only by email/cookie, binds acceptance to the browser and returns authenticated organization access",
    () =>
      Effect.gen(function* () {
        const owner = yield* completeTestSetup;
        const repository = yield* DatabaseRepository;
        const application = yield* Application;
        const ownerApi = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeaders({
                origin: "https://preface.example.test",
                cookie: `preface_session=${Redacted.value(owner.sessionToken)}`,
              }),
            ),
        });
        const created = yield* ownerApi.organizations.get();
        const params = { organizationId: created.organization.id };
        const memberRole = yield* repository.organization.role.findByKey(
          params.organizationId,
          "member",
        );
        if (memberRole === undefined) throw new Error("Expected member role");
        const [invitation, response] = yield* ownerApi.organizationInvitations.create({
          payload: { email: " New@Example.Test ", roleIds: [memberRole.id] },
          responseMode: "decoded-and-response",
        });
        expect(response.status).toBe(201);
        expect(invitation.email).toBe("new@example.test");
        expect(Object.keys(invitation)).not.toContain("tokenHash");
        const stored = yield* repository.organization.invitation.findById(
          params.organizationId,
          invitation.id,
        );
        if (stored === undefined) throw new Error("Expected invitation");
        const delivery = yield* ownerApi.organizationInvitations.delivery({
          params: { invitationId: invitation.id },
        });
        expect(delivery).toMatchObject({ status: "pending", attempts: 0, lastErrorCode: null });
        expect(delivery).not.toHaveProperty("encryptedPayload");
        expect(delivery).not.toHaveProperty("providerMessageId");
        const email = yield* readEmailJob(stored.emailJobId);
        if (email.type !== "organization-invitation") throw new Error("Expected invitation email");
        const token = new URLSearchParams(new URL(email.variables.invitationUrl).hash.slice(1)).get(
          "token",
        );
        if (token === null) throw new Error("Expected invitation token");
        const payload = { invitationId: invitation.id, token };
        const publicApi = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeader("origin", "https://preface.example.test"),
            ),
        });
        expect(
          yield* publicApi.organizationInvitations.list({ query: {} }).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
        expect((yield* publicApi.invitations.inspect({ payload })).organization.id).toBe(
          params.organizationId,
        );
        const [challenge, requested] = yield* publicApi.invitations.requestVerification({
          payload,
          responseMode: "decoded-and-response",
        });
        expect(Object.keys(challenge)).toEqual(["challengeId", "expiresAt"]);
        const browserToken = requested.cookies.cookies.preface_invitation?.value;
        if (browserToken === undefined) throw new Error("Expected invitation browser cookie");
        expect(requested.headers["set-cookie"]).toContain("HttpOnly");
        expect(requested.headers["set-cookie"]).toContain("Secure");
        const proof = yield* repository.auth.verification.findById(challenge.challengeId);
        if (proof?.emailJobId === undefined || proof.emailJobId === null)
          throw new Error("Expected verification job");
        const verificationEmail = yield* readEmailJob(proof.emailJobId);
        if (verificationEmail.type !== "invitation-verification")
          throw new Error("Expected verification email");
        const acceptance = {
          ...payload,
          challengeId: challenge.challengeId,
          displayName: "New Member",
          method: "code" as const,
          code: verificationEmail.variables.code,
        };
        expect(
          yield* publicApi.invitations.accept({ payload: acceptance }).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_PROOF" });
        const boundApi = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeaders({
                origin: "https://preface.example.test",
                cookie: `preface_invitation=${browserToken}`,
              }),
            ),
        });
        const [accepted, verified] = yield* boundApi.invitations.accept({
          payload: acceptance,
          responseMode: "decoded-and-response",
        });
        expect(verified.status).toBe(201);
        const sessionToken = verified.cookies.cookies.preface_session?.value;
        if (sessionToken === undefined) throw new Error("Expected session cookie");
        expect(verified.cookies.cookies.preface_invitation?.value).toBe("");
        expect(JSON.stringify(accepted)).not.toContain(token);
        expect(JSON.stringify(accepted)).not.toContain(sessionToken);
        const actor = yield* application.auth.session.resolve(Redacted.make(sessionToken));
        expect(
          (yield* application.organization.organization.getAccess(actor, params.organizationId))
            .memberId,
        ).toBe(accepted.memberId);
        expect(
          (yield* ownerApi.organizationInvitations.list({ query: {} })).invitations[0]
            ?.acceptedByUserId,
        ).toBe(accepted.actor.user.id);
        expect(
          yield* boundApi.invitations.accept({ payload: acceptance }).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_INVITATION" });
      }),
  );
});
