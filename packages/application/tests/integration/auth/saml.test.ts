import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Redacted, Ref } from "effect";
import { TestClock } from "effect/testing";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { signInTestUser } from "../../fixtures/email-sign-in.js";
import { createTestOrganization } from "../../fixtures/organization.js";
import { TestSaml } from "../../fixtures/saml-provider.js";
import {
  configureTestSaml,
  completeTestSaml,
  linkTestSaml,
  samlCallbackInput,
} from "../../fixtures/saml.js";

layer(ApplicationTestLayer)("Organization SAML", (it) => {
  it.effect(
    "stages verified assertions without authentication, then requires the initiating browser and session",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestSaml(owner.actor, organization.id);
        expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
        const unknown = yield* application.auth.saml.startSignIn(organization.id, connection.id);
        expect(yield* completeTestSaml(connection.id, unknown).pipe(Effect.flip)).toMatchObject({
          code: "IDENTITY_NOT_LINKED",
        });

        const link = yield* application.auth.saml.startLink(
          owner.actor,
          organization.id,
          connection.id,
        );
        const staged = yield* application.auth.saml.callback(
          connection.id,
          samlCallbackInput(link),
        );
        expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
        expect(
          yield* application.auth.saml
            .complete(
              { ...staged, browserToken: Redacted.make("wrong-browser".repeat(4)) },
              owner.actor,
            )
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        expect(
          yield* application.auth.saml
            .complete({ ...staged, browserToken: link.browserToken })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        yield* application.auth.saml.complete(
          { ...staged, browserToken: link.browserToken },
          owner.actor,
        );
        expect(
          (yield* repository.auth.authFlow.findById(staged.flowId))?.verifiedIdentityCiphertext,
        ).toBeNull();
        expect(
          yield* application.auth.saml
            .complete({ ...staged, browserToken: link.browserToken }, owner.actor)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });

        const signIn = yield* application.auth.saml.startSignIn(organization.id, connection.id);
        const completed = yield* completeTestSaml(connection.id, signIn);
        if (completed.sessionToken === undefined) throw new Error("Expected SAML session");
        const actor = yield* application.auth.session.resolve(completed.sessionToken);
        expect(actor.user.id).toBe(owner.actor.user.id);
        expect(
          (yield* application.organization.organization.get(actor, organization.id)).organization
            .id,
        ).toBe(organization.id);
        expect(yield* application.instance.capabilities.get(actor)).toEqual({
          canCreateOrganization: false,
        });
        expect(JSON.stringify(connection)).not.toContain("PRIVATE KEY");
      }),
  );

  it.effect(
    "reserves assertion identifiers across flows and invalidates staged trust after key rotation",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestSaml(owner.actor, organization.id);
        yield* linkTestSaml(owner.actor, organization.id, connection.id);
        yield* Ref.update((yield* TestSaml).identity, (identity) => ({
          ...identity,
          responseId: "one-response",
          assertionId: "one-assertion",
        }));
        const first = yield* application.auth.saml.startSignIn(organization.id, connection.id);
        const staged = yield* application.auth.saml.callback(
          connection.id,
          samlCallbackInput(first),
        );
        expect(
          yield* application.auth.saml
            .callback(connection.id, samlCallbackInput(first))
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        const second = yield* application.auth.saml.startSignIn(organization.id, connection.id);
        expect(
          yield* application.auth.saml
            .callback(connection.id, samlCallbackInput(second))
            .pipe(Effect.flip),
        ).toMatchObject({ code: "SAML_REPLAY" });
        const rotated = yield* application.organization.identityConnection.rotateSigningKey(
          owner.actor,
          organization.id,
          connection.id,
          connection.revision,
        );
        expect(rotated.status).toBe("draft");
        expect(rotated.configuration.signingCertificate).not.toBe(
          connection.configuration.signingCertificate,
        );
        expect(
          yield* application.auth.saml
            .complete({ ...staged, browserToken: first.browserToken })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        expect(
          yield* application.organization.identityConnection
            .activate(owner.actor, organization.id, connection.id, rotated.revision)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "CONNECTION_NOT_TESTED" });
      }),
  );

  it.effect(
    "enforces SAML freshness and last-owner recovery while preserving independent policy edits",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestSaml(owner.actor, organization.id);
        yield* linkTestSaml(owner.actor, organization.id, connection.id);
        const recovery = yield* application.organization.authRecovery.rotate(
          owner.actor,
          organization.id,
        );
        const current = yield* application.organization.authPolicy.get(
          owner.actor,
          organization.id,
        );
        const policy = yield* application.organization.authPolicy.update(
          owner.actor,
          organization.id,
          {
            expectedRevision: current.revision,
            ssoMode: "required",
            ssoMaxAgeSeconds: 300,
            recoveryCredential: recovery.recoveryCredential,
          },
        );
        expect(
          yield* application.organization.identityConnection
            .disable(owner.actor, organization.id, connection.id, connection.revision)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "LAST_AUTHENTICATION_PATH" });
        const edited = yield* application.organization.authPolicy.update(
          owner.actor,
          organization.id,
          { expectedRevision: policy.revision, googleEnabled: false },
        );
        expect(edited.samlConnectionIds).toEqual([connection.id]);
        const oldTime = yield* DateTime.now;
        yield* TestClock.adjust("6 minutes");
        expect(
          yield* application.organization.organization
            .get(owner.actor, organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
        yield* Ref.update((yield* TestSaml).identity, (identity) => ({
          ...identity,
          authenticatedAt: oldTime,
        }));
        const stale = yield* application.auth.saml.startReauthentication(
          owner.actor,
          organization.id,
          connection.id,
        );
        expect(new URL(stale.authorizationUrl).searchParams.get("ForceAuthn")).toBe("true");
        expect(
          yield* completeTestSaml(connection.id, stale, owner.actor).pipe(Effect.flip),
        ).toMatchObject({ code: "RECENT_SSO_REQUIRED" });
        const freshTime = yield* DateTime.now;
        yield* Ref.update((yield* TestSaml).identity, (identity) => ({
          ...identity,
          authenticatedAt: freshTime,
        }));
        const fresh = yield* application.auth.saml.startReauthentication(
          owner.actor,
          organization.id,
          connection.id,
        );
        yield* completeTestSaml(connection.id, fresh, owner.actor);
        expect((yield* application.auth.session.resolve(owner.sessionToken)).session).toEqual(
          owner.actor.session,
        );
        expect(
          (yield* application.organization.organization.get(owner.actor, organization.id))
            .organization.id,
        ).toBe(organization.id);
        const returning = yield* signInTestUser(owner.actor.user.email);
        const recovered = yield* application.organization.authRecovery.recover(
          returning.actor,
          organization.id,
          {
            expectedRevision: edited.revision,
            recoveryCredential: recovery.recoveryCredential,
          },
        );
        expect(recovered.ssoMode).toBe("optional");
        expect(recovered.samlConnectionIds).toEqual([connection.id]);
      }),
  );
});
