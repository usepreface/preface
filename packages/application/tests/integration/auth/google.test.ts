import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { TestClock } from "effect/testing";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";
import { readEmailJob } from "../../fixtures/email-job.js";
import {
  configureTestGoogle,
  googleCallbackInput,
  linkTestGoogle,
  signInTestGoogle,
} from "../../fixtures/google.js";
import { createTestIdentity, createTestOrganization } from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("Google identity workflows", (it) => {
  it.effect(
    "tests configuration without linking, then explicitly links and signs into the same user without admitting unknown identities",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const owner = yield* completeTestBootstrap;
        const config = yield* configureTestGoogle(owner.actor);
        expect(config.status).toBe("active");
        expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
        const unknown = yield* application.auth.google.start();
        expect(
          yield* application.auth.google
            .callback(yield* googleCallbackInput(unknown))
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "IdentityError", code: "IDENTITY_NOT_LINKED" });
        const linked = yield* linkTestGoogle(owner.actor);
        const signedIn = yield* signInTestGoogle;
        expect(signedIn.actor.user.id).toBe(owner.actor.user.id);
        expect(signedIn.actor.user.email).toBe(owner.actor.user.email);
        expect(signedIn.actor.session.id).not.toBe(owner.actor.session.id);
        expect(
          (yield* repository.auth.sessionAuthentication.listUsableBySessionId(
            signedIn.actor.session.id,
          )).map((proof) => proof.method),
        ).toEqual(["google"]);
        const other = yield* createTestIdentity("different@example.test", "Different User");
        const attempt = yield* application.auth.account.startGoogle(other.actor);
        expect(
          yield* application.auth.google
            .callback(yield* googleCallbackInput(attempt), other.actor)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "IdentityError", code: "ACCOUNT_ALREADY_LINKED" });
        expect((yield* application.auth.account.list(owner.actor)).accounts[0]?.id).toBe(linked.id);
      }),
  );

  it.effect(
    "binds callbacks to one browser and initiating session, rejects replay, and revokes pending flows and evidence on disable",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const owner = yield* completeTestBootstrap;
        const config = yield* configureTestGoogle(owner.actor);
        yield* linkTestGoogle(owner.actor);
        const started = yield* application.auth.google.start();
        const proof = yield* googleCallbackInput(started);
        expect(
          yield* application.auth.google
            .callback({ ...proof, browserToken: Redacted.make("wrong-browser") })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "IdentityError", code: "INVALID_FLOW" });
        const completed = yield* application.auth.google.callback(proof);
        expect(yield* application.auth.google.callback(proof).pipe(Effect.flip)).toMatchObject({
          _tag: "IdentityError",
          code: "INVALID_FLOW",
        });
        if (completed.sessionToken === undefined) throw new Error("Expected session token");
        const pending = yield* application.auth.google.start();
        yield* application.instance.authentication.google.disable(owner.actor, config.revision);
        expect(
          yield* application.auth.google
            .callback(yield* googleCallbackInput(pending))
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "IdentityError", code: "INVALID_FLOW" });
        expect(
          yield* application.auth.session.resolve(completed.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
        expect((yield* application.auth.session.resolve(owner.sessionToken)).user.id).toBe(
          owner.actor.user.id,
        );
      }),
  );

  it.effect(
    "requires explicit organization opt-in and adds email evidence to a Google session without changing its identity",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        yield* configureTestGoogle(fixture.owner.actor);
        yield* linkTestGoogle(fixture.owner.actor);
        const google = yield* signInTestGoogle;
        expect(
          yield* application.organization.organization
            .get(google.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "AUTHENTICATION_REQUIRED" });
        expect(
          yield* application.organization.authPolicy.methods(google.actor, fixture.organization.id),
        ).toMatchObject({
          email: true,
          googleEnabled: false,
          googleAvailable: true,
          googleEffective: false,
        });
        const policy = yield* application.organization.authPolicy.update(
          fixture.owner.actor,
          fixture.organization.id,
          { expectedRevision: 1, googleEnabled: true },
        );
        expect(
          (yield* application.organization.organization.get(google.actor, fixture.organization.id))
            .access.isOwner,
        ).toBe(true);
        yield* application.organization.authPolicy.update(
          fixture.owner.actor,
          fixture.organization.id,
          { expectedRevision: policy.revision, googleEnabled: false },
        );
        const issued = yield* application.auth.reauthentication.email.request(google.actor);
        const stored = yield* repository.auth.verification.findById(issued.challenge.challengeId);
        if (stored?.emailJobId === undefined || stored.emailJobId === null)
          throw new Error("Expected reauthentication email");
        const mail = yield* readEmailJob(stored.emailJobId);
        if (mail.type !== "email-reauthentication")
          throw new Error("Expected reauthentication payload");
        const input = {
          challengeId: issued.challenge.challengeId,
          browserToken: issued.browserToken,
          method: "code" as const,
          code: Redacted.make(mail.variables.code),
        };
        expect(yield* application.auth.emailSignIn.verify(input).pipe(Effect.flip)).toMatchObject({
          _tag: "EmailSignInError",
          code: "INVALID_PROOF",
        });
        yield* application.auth.reauthentication.email.verify(google.actor, input);
        expect((yield* application.auth.session.resolve(google.sessionToken)).session.id).toBe(
          google.actor.session.id,
        );
        expect(
          (yield* application.organization.organization.get(google.actor, fixture.organization.id))
            .access.isOwner,
        ).toBe(true);
        expect(
          yield* application.auth.reauthentication.email
            .verify(google.actor, input)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "IdentityError", code: "INVALID_PROOF" });
      }),
  );

  it.effect(
    "requires recent email proof for unlinking and revokes the Google source without destroying independent email sessions",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const owner = yield* completeTestBootstrap;
        yield* configureTestGoogle(owner.actor);
        const account = yield* linkTestGoogle(owner.actor);
        const google = yield* signInTestGoogle;
        expect(
          yield* application.auth.account.unlink(google.actor, account.id).pipe(Effect.flip),
        ).toMatchObject({ _tag: "IdentityError", code: "REAUTHENTICATION_REQUIRED" });
        yield* application.auth.account.unlink(owner.actor, account.id);
        expect(
          yield* application.auth.session.resolve(google.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
        expect((yield* application.auth.session.resolve(owner.sessionToken)).user.id).toBe(
          owner.actor.user.id,
        );
        yield* TestClock.adjust("6 minutes");
        expect(
          yield* application.auth.account.startGoogle(owner.actor).pipe(Effect.flip),
        ).toMatchObject({ _tag: "IdentityError", code: "REAUTHENTICATION_REQUIRED" });
      }),
  );
});
