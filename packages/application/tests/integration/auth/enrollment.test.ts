import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Redacted, Ref } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { readEmailJob } from "../../fixtures/email-job.js";
import { TestGoogle } from "../../fixtures/google-provider.js";
import { configureTestGoogle, googleCallbackInput } from "../../fixtures/google.js";
import { createTestInvitation } from "../../fixtures/invitation.js";
import { TestOidc } from "../../fixtures/oidc-provider.js";
import { configureTestOidc, oidcCallbackInput } from "../../fixtures/oidc.js";
import { createTestOrganization } from "../../fixtures/organization.js";
import { TestSaml } from "../../fixtures/saml-provider.js";
import { completeTestSaml, configureTestSaml } from "../../fixtures/saml.js";

layer(ApplicationTestLayer)("External identity enrollment", (it) => {
  it.effect(
    "admits an invited Google Workspace identity, then keeps its stable account after an email claim changes",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const { owner, organization } = yield* createTestOrganization;
        const google = yield* configureTestGoogle(owner.actor);
        if (google.id === null) throw new Error("Expected Google connection");
        const policy = yield* application.organization.authPolicy.get(owner.actor, organization.id);
        yield* application.organization.authPolicy.update(owner.actor, organization.id, {
          expectedRevision: policy.revision,
          googleEnabled: true,
        });
        const invitation = yield* createTestInvitation(
          owner.actor,
          organization.id,
          "alice@company.example.test",
        );
        const provider = yield* TestGoogle;
        yield* Ref.set(provider.identity, {
          subject: "workspace-alice",
          email: "alice@company.example.test",
          emailVerified: true,
          hostedDomain: "company.example.test",
        });
        const started = yield* application.auth.external.invitation.start({
          ...invitation.input,
          connectionId: google.id,
          displayName: "Alice",
        });
        const result = yield* application.auth.google.callback(yield* googleCallbackInput(started));
        if (result.sessionToken === undefined) throw new Error("Expected new Google session");
        const actor = yield* application.auth.session.resolve(result.sessionToken);
        expect(actor.user.email).toBe("alice@company.example.test");
        expect(
          yield* repository.organization.member.findByUserId(organization.id, actor.user.id),
        ).toMatchObject({ suspendedAt: null, removedAt: null });
        yield* Ref.set(provider.identity, {
          subject: "workspace-alice",
          email: "changed@company.example.test",
          emailVerified: true,
          hostedDomain: "company.example.test",
        });
        const returning = yield* application.auth.google.start();
        const completed = yield* application.auth.google.callback(
          yield* googleCallbackInput(returning),
        );
        if (completed.sessionToken === undefined) throw new Error("Expected returning session");
        const same = yield* application.auth.session.resolve(completed.sessionToken);
        expect(same.user.id).toBe(actor.user.id);
        expect(same.user.email).toBe("alice@company.example.test");
      }),
  );

  it.effect("admits a new invited OIDC user directly through exact trusted-domain authority", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const { owner, organization } = yield* createTestOrganization;
      const connection = yield* configureTestOidc(owner.actor, organization.id);
      const domain = yield* application.organization.domain.create(owner.actor, organization.id, {
        domain: "company.example.test",
      });
      yield* application.organization.domain.verify(
        owner.actor,
        organization.id,
        domain.id,
        domain.revision,
        "operator",
      );
      yield* application.organization.domain.bind(owner.actor, organization.id, connection.id, {
        expectedRevision: connection.revision,
        domainIds: [domain.id],
      });
      const invitation = yield* createTestInvitation(
        owner.actor,
        organization.id,
        "alice@company.example.test",
      );
      yield* Ref.set((yield* TestOidc).identity, {
        issuer: "https://identity.example.test",
        subject: "employee-alice",
        email: "alice@company.example.test",
        emailVerified: false,
      });

      const started = yield* application.auth.external.invitation.start({
        ...invitation.input,
        connectionId: connection.id,
        displayName: "Alice",
      });
      const result = yield* application.auth.oidc.callback(yield* oidcCallbackInput(started));
      expect(result.nextAction).toBe("continue");
      if (result.sessionToken === undefined) throw new Error("Expected enrolled session");
      const actor = yield* application.auth.session.resolve(result.sessionToken);
      expect(actor.user.email).toBe("alice@company.example.test");
      expect(
        (yield* application.organization.organization.get(actor, organization.id)).organization.id,
      ).toBe(organization.id);
      expect(
        (yield* repository.organization.invitation.findById(
          organization.id,
          invitation.invitation.id,
        ))?.acceptedByUserId,
      ).toBe(actor.user.id);
      expect(
        yield* application.instance.authentication.google.get(actor).pipe(Effect.flip),
      ).toMatchObject({ code: "REAUTHENTICATION_REQUIRED" });
      expect(
        yield* application.auth.oidc.callback(yield* oidcCallbackInput(started)).pipe(Effect.flip),
      ).toMatchObject({ code: "INVALID_FLOW" });
    }),
  );

  it.effect(
    "continues SAML enrollment through a browser-bound code without repeating provider verification",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestSaml(owner.actor, organization.id);
        const invitation = yield* createTestInvitation(
          owner.actor,
          organization.id,
          "guest@external.example.test",
        );
        yield* Ref.set((yield* TestSaml).identity, {
          issuer: "https://saml.example.test",
          subject: "guest-subject",
          email: "guest@external.example.test",
        });
        const started = yield* application.auth.external.invitation.start({
          ...invitation.input,
          connectionId: connection.id,
          displayName: "Guest",
        });
        const pending = yield* completeTestSaml(connection.id, started);
        expect(pending.nextAction).toBe("verify_email");
        expect(
          yield* repository.auth.userEmail.findActiveByEmail("guest@external.example.test"),
        ).toBeUndefined();
        const bound = { flowId: pending.flowId, browserToken: started.browserToken };
        expect(
          yield* application.auth.external
            .status({ ...bound, browserToken: Redacted.make("wrong-browser") })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        const challenge = yield* application.auth.external.request(bound);
        const proof = yield* repository.auth.verification.findById(challenge.challengeId);
        if (proof?.emailJobId === null || proof?.emailJobId === undefined)
          throw new Error("Expected verification email intent");
        const payload = yield* readEmailJob(proof.emailJobId);
        if (payload.type !== "identity-verification")
          throw new Error("Expected external verification payload");
        const completed = yield* application.auth.external.verify({
          ...bound,
          challengeId: challenge.challengeId,
          code: Redacted.make(payload.variables.code),
        });
        if (completed.sessionToken === undefined) throw new Error("Expected enrolled session");
        const actor = yield* application.auth.session.resolve(completed.sessionToken);
        expect(actor.user.email).toBe("guest@external.example.test");
        expect(
          (yield* application.organization.organization.get(actor, organization.id)).organization
            .id,
        ).toBe(organization.id);
        expect(yield* application.auth.external.resume(bound).pipe(Effect.flip)).toMatchObject({
          code: "INVALID_FLOW",
        });
      }),
  );

  it.effect(
    "invalidates pending provider enrollment when an invitation credential is replaced",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const invitation = yield* createTestInvitation(
          owner.actor,
          organization.id,
          "alice@example.test",
        );
        yield* Ref.set((yield* TestOidc).identity, {
          issuer: "https://identity.example.test",
          subject: "alice-oidc",
          email: "alice@example.test",
          emailVerified: true,
        });
        const started = yield* application.auth.external.invitation.start({
          ...invitation.input,
          connectionId: connection.id,
          displayName: "Alice",
        });
        const pending = yield* application.auth.oidc.callback(yield* oidcCallbackInput(started));
        expect(pending.nextAction).toBe("verify_email");
        yield* application.organization.invitation.resend(
          owner.actor,
          organization.id,
          invitation.invitation.id,
        );
        expect(
          yield* application.auth.external
            .request({ flowId: pending.flowId, browserToken: started.browserToken })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
      }),
  );
  it.effect("links an existing member by trusted email and preserves deliberate unlinking", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const { owner, organization } = yield* createTestOrganization;
      const connection = yield* configureTestOidc(owner.actor, organization.id);
      const domain = yield* application.organization.domain.create(owner.actor, organization.id, {
        domain: "example.test",
      });
      yield* application.organization.domain.verify(
        owner.actor,
        organization.id,
        domain.id,
        domain.revision,
        "operator",
      );
      yield* application.organization.domain.bind(owner.actor, organization.id, connection.id, {
        expectedRevision: connection.revision,
        domainIds: [domain.id],
      });
      yield* Ref.set((yield* TestOidc).identity, {
        issuer: "https://identity.example.test",
        subject: "owner-new-subject",
        email: owner.actor.user.email,
        emailVerified: true,
      });
      const started = yield* application.auth.oidc.startSignIn(organization.id, connection.id);
      const completed = yield* application.auth.oidc.callback(yield* oidcCallbackInput(started));
      if (completed.sessionToken === undefined)
        throw new Error("Expected automatically linked session");
      const actor = yield* application.auth.session.resolve(completed.sessionToken);
      expect(actor.user.id).toBe(owner.actor.user.id);
      const accounts = (yield* application.auth.account.list(owner.actor)).accounts;
      expect(accounts).toHaveLength(1);
      const account = accounts[0];
      if (account === undefined) throw new Error("Expected linked identity");
      yield* application.auth.account.unlink(owner.actor, account.id);
      const restarted = yield* application.auth.oidc.startSignIn(organization.id, connection.id);
      expect(
        yield* application.auth.oidc
          .callback(yield* oidcCallbackInput(restarted))
          .pipe(Effect.flip),
      ).toMatchObject({ code: "IDENTITY_NOT_LINKED" });
    }),
  );

  it.effect("uses a fresh emailed invitation as mailbox proof for first-time SSO", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const { owner, organization } = yield* createTestOrganization;
      const connection = yield* configureTestOidc(owner.actor, organization.id);
      const invitation = yield* createTestInvitation(
        owner.actor,
        organization.id,
        "contractor@external.example.test",
      );
      const stored = yield* repository.organization.invitation.findById(
        organization.id,
        invitation.invitation.id,
      );
      const now = yield* DateTime.now;
      const delivery = {
        leaseToken: "fixture-delivery",
        leaseExpiresAt: DateTime.addDuration(now, "30 seconds"),
        maximumAttempts: 5,
        provider: "development" as const,
        supportsIdempotency: true,
        replayAfter: DateTime.subtractDuration(now, "1 hour"),
      };
      const first = yield* repository.jobs.email.claim(delivery);
      // Connection policy setup also queues an owner alert before the invitation.
      if (first !== undefined && first.id !== stored?.emailJobId)
        yield* repository.jobs.email.finish({
          id: first.id,
          leaseToken: delivery.leaseToken,
          status: "sent",
        });
      const sent =
        first?.id === stored?.emailJobId ? first : yield* repository.jobs.email.claim(delivery);
      if (sent === undefined || sent.id !== stored?.emailJobId)
        throw new Error("Expected current invitation delivery");
      yield* repository.jobs.email.finish({
        id: sent.id,
        leaseToken: "fixture-delivery",
        status: "sent",
      });
      yield* Ref.set((yield* TestOidc).identity, {
        issuer: "https://identity.example.test",
        subject: "contractor-subject",
        email: "contractor@external.example.test",
        emailVerified: false,
      });
      const started = yield* application.auth.external.invitation.start({
        ...invitation.input,
        connectionId: connection.id,
        displayName: "Contractor",
      });
      const completed = yield* application.auth.oidc.callback(yield* oidcCallbackInput(started));
      expect(completed.nextAction).toBe("continue");
      if (completed.sessionToken === undefined)
        throw new Error("Expected directly enrolled session");
      expect((yield* application.auth.session.resolve(completed.sessionToken)).user.email).toBe(
        "contractor@external.example.test",
      );
    }),
  );
});
