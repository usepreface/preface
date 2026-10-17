import { expect, layer } from "@effect/vitest";
import { DateTime, Deferred, Effect, Fiber, Redacted, Ref } from "effect";
import { TestClock } from "effect/testing";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { signInTestUser } from "../../fixtures/email-sign-in.js";
import { createTestInvitation, requestInvitationProof } from "../../fixtures/invitation.js";
import { TestOidc } from "../../fixtures/oidc-provider.js";
import { configureTestOidc, linkTestOidc, oidcCallbackInput } from "../../fixtures/oidc.js";
import {
  createTestIdentity,
  createTestOrganization,
  admitTestMember,
} from "../../fixtures/organization.js";
import { createRequiredSsoOrganization } from "../../fixtures/required-sso.js";

layer(ApplicationTestLayer)("Required organization SSO", (it) => {
  it.effect(
    "requires recovery possession and fresh approved provider proof before enabling enforcement",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const initial = yield* application.organization.authPolicy.readiness(
          owner.actor,
          organization.id,
        );
        expect(initial.blockers).toContain("OWNER_ACCOUNT_NOT_LINKED");
        expect(initial.blockers).toContain("RECOVERY_CREDENTIAL_REQUIRED");
        expect(
          yield* application.organization.authPolicy
            .update(owner.actor, organization.id, {
              expectedRevision: initial.policyRevision,
              ssoMode: "required",
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "RECOVERY_CREDENTIAL_REQUIRED" });
        const credential = yield* application.organization.authRecovery.rotate(
          owner.actor,
          organization.id,
        );
        expect(
          yield* application.organization.authPolicy
            .update(owner.actor, organization.id, {
              expectedRevision: initial.policyRevision,
              ssoMode: "required",
              recoveryCredential: Redacted.make("wrong-credential"),
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_RECOVERY_CREDENTIAL" });
        expect(
          yield* application.organization.authPolicy
            .update(owner.actor, organization.id, {
              expectedRevision: initial.policyRevision,
              ssoMode: "required",
              recoveryCredential: credential.recoveryCredential,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "RECENT_SSO_REQUIRED" });
        yield* linkTestOidc(owner.actor, organization.id, connection.id);
        expect(
          (yield* application.organization.authPolicy.readiness(owner.actor, organization.id))
            .ready,
        ).toBe(true);
        const policy = yield* application.organization.authPolicy.update(
          owner.actor,
          organization.id,
          {
            expectedRevision: initial.policyRevision,
            ssoMode: "required",
            recoveryCredential: credential.recoveryCredential,
          },
        );
        expect(policy.ssoMode).toBe("required");
        expect(
          (yield* application.organization.authRecovery.get(owner.actor, organization.id))
            .credential?.id,
        ).toBe(credential.id);
        expect(
          JSON.stringify(
            yield* application.organization.authRecovery.get(owner.actor, organization.id),
          ),
        ).not.toContain(Redacted.value(credential.recoveryCredential));
      }),
  );

  it.effect(
    "keeps global email login and membership discovery while requiring organization-specific SSO proof",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const fixture = yield* createRequiredSsoOrganization;
        const email = yield* signInTestUser(fixture.owner.actor.user.email);
        expect((yield* application.auth.session.resolve(email.sessionToken)).user.id).toBe(
          fixture.owner.actor.user.id,
        );
        expect(
          (yield* application.organization.organization.listMine(email.actor, {})).organizations,
        ).toHaveLength(1);
        expect(
          yield* application.organization.organization
            .get(email.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
        expect(
          yield* application.organization.authPolicy.methods(email.actor, fixture.organization.id),
        ).toMatchObject({
          ssoMode: "required",
          email: true,
          emailSatisfiesOrganization: false,
          authenticationSatisfied: false,
          nextAction: "authenticate_with_sso",
        });
        const other = yield* application.organization.organization.create(email.actor, {
          metadata: { name: "Other" },
          slug: "other",
        });
        const otherConnection = yield* configureTestOidc(email.actor, other.organization.id);
        yield* linkTestOidc(email.actor, other.organization.id, otherConnection.id);
        expect(
          yield* application.organization.organization
            .get(email.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
        const start = yield* application.auth.oidc.startReauthentication(
          email.actor,
          fixture.organization.id,
          fixture.connection.id,
        );
        yield* application.auth.oidc.callback(yield* oidcCallbackInput(start), email.actor);
        expect(
          (yield* application.organization.organization.get(email.actor, fixture.organization.id))
            .organization.id,
        ).toBe(fixture.organization.id);
      }),
  );

  it.effect(
    "ages provider authentication independently of callbacks and reauthenticates without extending the session",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const fixture = yield* createRequiredSsoOrganization;
        yield* application.organization.authPolicy.update(
          fixture.owner.actor,
          fixture.organization.id,
          {
            expectedRevision: fixture.policy.revision,
            ssoMaxAgeSeconds: 300,
          },
        );
        const originalSession = fixture.owner.actor.session;
        const oldTime = yield* DateTime.now;
        yield* TestClock.adjust("6 minutes");
        expect(
          yield* application.organization.organization
            .get(fixture.owner.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
        expect(
          (yield* application.organization.authPolicy.methods(
            fixture.owner.actor,
            fixture.organization.id,
          )).nextAction,
        ).toBe("reauthenticate_with_sso");
        const provider = yield* TestOidc;
        yield* Ref.update(provider.identity, (identity) => ({
          ...identity,
          authenticatedAt: oldTime,
        }));
        const stale = yield* application.auth.oidc.startReauthentication(
          fixture.owner.actor,
          fixture.organization.id,
          fixture.connection.id,
        );
        expect(new URL(stale.authorizationUrl).searchParams.get("max_age")).toBe("0");
        expect(
          yield* application.auth.oidc
            .callback(yield* oidcCallbackInput(stale), fixture.owner.actor)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "RECENT_SSO_REQUIRED" });
        yield* Ref.update(provider.identity, (identity) => ({
          ...identity,
          authenticatedAt: null,
        }));
        const missing = yield* application.auth.oidc.startReauthentication(
          fixture.owner.actor,
          fixture.organization.id,
          fixture.connection.id,
        );
        expect(
          yield* application.auth.oidc
            .callback(yield* oidcCallbackInput(missing), fixture.owner.actor)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "RECENT_SSO_REQUIRED" });
        const now = yield* DateTime.now;
        yield* Ref.update(provider.identity, (identity) => ({ ...identity, authenticatedAt: now }));
        const fresh = yield* application.auth.oidc.startReauthentication(
          fixture.owner.actor,
          fixture.organization.id,
          fixture.connection.id,
        );
        yield* application.auth.oidc.callback(yield* oidcCallbackInput(fresh), fixture.owner.actor);
        expect(
          (yield* application.organization.organization.get(
            fixture.owner.actor,
            fixture.organization.id,
          )).organization.id,
        ).toBe(fixture.organization.id);
        expect(
          (yield* application.auth.session.resolve(fixture.owner.sessionToken)).session,
        ).toEqual(originalSession);
      }),
  );

  it.effect(
    "admits an invited mailbox then requires explicit provider linking before organization access",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const fixture = yield* createRequiredSsoOrganization;
        const invitation = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "new@example.test",
        );
        const accepted = yield* application.organization.invitation.accept(
          yield* requestInvitationProof(invitation.input),
        );
        expect(accepted.nextAction).toBe("authenticate_with_sso");
        expect(
          yield* application.organization.organization
            .get(accepted.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
        expect(
          (yield* application.organization.authPolicy.methods(
            accepted.actor,
            fixture.organization.id,
          )).oidc[0]?.linked,
        ).toBe(false);
        const provider = yield* TestOidc;
        yield* Ref.update(provider.identity, (identity) => ({
          ...identity,
          subject: "new-invited-member",
        }));
        yield* linkTestOidc(accepted.actor, fixture.organization.id, fixture.connection.id);
        expect(
          (yield* application.organization.organization.get(
            accepted.actor,
            fixture.organization.id,
          )).access.permissions,
        ).toContain("organization.read");
      }),
  );

  it.effect(
    "rolls back changes that would remove the final owner authentication or offline recovery path",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createRequiredSsoOrganization;
        expect(
          yield* application.auth.account
            .unlink(fixture.owner.actor, fixture.account.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "LAST_AUTHENTICATION_PATH" });
        expect(
          (yield* repository.auth.account.findById(fixture.account.id))?.unlinkedAt,
        ).toBeNull();
        expect(
          yield* application.organization.identityConnection
            .disable(
              fixture.owner.actor,
              fixture.organization.id,
              fixture.connection.id,
              fixture.connection.revision,
            )
            .pipe(Effect.flip),
        ).toMatchObject({ code: "LAST_AUTHENTICATION_PATH" });
        expect(
          yield* application.organization.identityConnection
            .refreshMetadata(
              fixture.owner.actor,
              fixture.organization.id,
              fixture.connection.id,
              fixture.connection.revision,
            )
            .pipe(Effect.flip),
        ).toMatchObject({ code: "LAST_AUTHENTICATION_PATH" });
        expect(
          (yield* repository.auth.identityConnection.findById(fixture.connection.id))?.status,
        ).toBe("active");
        expect(
          yield* application.organization.authPolicy
            .update(fixture.owner.actor, fixture.organization.id, {
              expectedRevision: fixture.policy.revision,
              oidcConnectionIds: [],
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "LAST_AUTHENTICATION_PATH" });
        expect(
          yield* application.organization.authRecovery
            .revoke(fixture.owner.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "LAST_AUTHENTICATION_PATH" });
        expect(
          (yield* application.organization.authRecovery.get(
            fixture.owner.actor,
            fixture.organization.id,
          )).credential?.id,
        ).toBe(fixture.recovery.id);
        const next = yield* createTestIdentity("next@example.test", "Next Owner");
        const member = yield* admitTestMember(fixture.organization.id, next.actor.user.id);
        yield* Ref.update((yield* TestOidc).identity, (identity) => ({
          ...identity,
          subject: "next-owner",
        }));
        yield* linkTestOidc(next.actor, fixture.organization.id, fixture.connection.id);
        yield* application.organization.ownership.grant(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        expect(
          yield* application.organization.ownership
            .transfer(fixture.owner.actor, fixture.organization.id, member.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "LAST_AUTHENTICATION_PATH" });
        const nextCredential = yield* application.organization.authRecovery.rotate(
          next.actor,
          fixture.organization.id,
        );
        yield* application.organization.authRecovery.revoke(next.actor, fixture.organization.id);
        expect(
          (yield* application.organization.authRecovery.get(next.actor, fixture.organization.id))
            .credential,
        ).toBeNull();
        yield* application.organization.authRecovery.rotate(next.actor, fixture.organization.id);
        expect(
          yield* application.organization.authRecovery
            .recover(next.actor, fixture.organization.id, {
              expectedRevision: fixture.policy.revision,
              recoveryCredential: nextCredential.recoveryCredential,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_RECOVERY_CREDENTIAL" });
        yield* application.organization.ownership.transfer(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        expect(
          yield* repository.organization.authRecoveryToken.findActiveByMember(
            fixture.organization.id,
            fixture.membership.id,
          ),
        ).toBeUndefined();
        expect(
          yield* application.organization.authRecovery
            .recover(fixture.owner.actor, fixture.organization.id, {
              expectedRevision: fixture.policy.revision,
              recoveryCredential: fixture.recovery.recoveryCredential,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "FORBIDDEN" });
      }),
  );
  it.effect("rechecks enforcement enabled while an optional sign-in exchange is in flight", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const { owner, organization } = yield* createTestOrganization;
      const connection = yield* configureTestOidc(owner.actor, organization.id);
      yield* linkTestOidc(owner.actor, organization.id, connection.id);
      const credential = yield* application.organization.authRecovery.rotate(
        owner.actor,
        organization.id,
      );
      const current = yield* application.organization.authPolicy.get(owner.actor, organization.id);
      const provider = yield* TestOidc;
      const exchanging = yield* Deferred.make<void>();
      const resume = yield* Deferred.make<void>();
      yield* Ref.set(
        provider.gate,
        Deferred.succeed(exchanging, undefined).pipe(Effect.andThen(Deferred.await(resume))),
      );
      const started = yield* application.auth.oidc.startSignIn(organization.id, connection.id);
      const completion = yield* application.auth.oidc
        .callback(yield* oidcCallbackInput(started))
        .pipe(Effect.result, Effect.forkChild);
      yield* Deferred.await(exchanging);
      const oldTime = DateTime.subtractDuration(yield* DateTime.now, "10 minutes");
      yield* Ref.update(provider.identity, (identity) => ({
        ...identity,
        authenticatedAt: oldTime,
      }));
      yield* application.organization.authPolicy.update(owner.actor, organization.id, {
        expectedRevision: current.revision,
        ssoMode: "required",
        ssoMaxAgeSeconds: 300,
        recoveryCredential: credential.recoveryCredential,
      });
      yield* Deferred.succeed(resume, undefined);
      expect(yield* Fiber.join(completion)).toMatchObject({
        _tag: "Failure",
        failure: { code: "RECENT_SSO_REQUIRED" },
      });
    }),
  );
});
