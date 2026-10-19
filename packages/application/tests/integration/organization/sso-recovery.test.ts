import { expect, layer } from "@effect/vitest";
import { Effect, Redacted, Ref, Result } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { rejectOrganizationSecurityEmail } from "../../fixtures/email-failure.js";
import { signInTestUser } from "../../fixtures/email-sign-in.js";
import { TestOidc } from "../../fixtures/oidc-provider.js";
import { linkTestOidc } from "../../fixtures/oidc.js";
import { createTestIdentity, admitTestMember } from "../../fixtures/organization.js";
import { createRequiredSsoOrganization } from "../../fixtures/required-sso.js";

layer(ApplicationTestLayer)("Organization SSO recovery", (it) => {
  it.effect(
    "recovers after a week using email and one owner-bound credential without contacting the provider",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createRequiredSsoOrganization;
        const provider = yield* TestOidc;
        const calls = yield* Ref.get(provider.calls);
        const colleague = yield* createTestIdentity("colleague@example.test", "Colleague");
        yield* admitTestMember(fixture.organization.id, colleague.actor.user.id);
        expect(
          yield* application.organization.authRecovery
            .recover(colleague.actor, fixture.organization.id, {
              expectedRevision: fixture.policy.revision,
              recoveryCredential: fixture.recovery.recoveryCredential,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "FORBIDDEN" });
        yield* TestClock.adjust("8 days");
        const email = yield* signInTestUser(fixture.owner.actor.user.email);
        expect(
          yield* application.organization.organization
            .get(email.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
        expect(
          yield* application.organization.authRecovery
            .recover(email.actor, fixture.organization.id, {
              expectedRevision: fixture.policy.revision,
              recoveryCredential: Redacted.make("incorrect-token"),
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_RECOVERY_CREDENTIAL" });
        const policy = yield* application.organization.authRecovery.recover(
          email.actor,
          fixture.organization.id,
          {
            expectedRevision: fixture.policy.revision,
            recoveryCredential: fixture.recovery.recoveryCredential,
          },
        );
        expect(policy.ssoMode).toBe("optional");
        expect(
          (yield* application.organization.organization.get(email.actor, fixture.organization.id))
            .access.isOwner,
        ).toBe(true);
        expect(
          yield* repository.organization.authRecoveryToken.findActiveByMember(
            fixture.organization.id,
            fixture.membership.id,
          ),
        ).toBeUndefined();
        expect(
          yield* application.organization.authRecovery
            .recover(email.actor, fixture.organization.id, {
              expectedRevision: policy.revision,
              recoveryCredential: fixture.recovery.recoveryCredential,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_RECOVERY_CREDENTIAL" });
        expect(yield* Ref.get(provider.calls)).toBe(calls);
        yield* application.organization.identityConnection.disable(
          email.actor,
          fixture.organization.id,
          fixture.connection.id,
          fixture.connection.revision,
        );
        expect(
          (yield* repository.auth.identityConnection.findById(fixture.connection.id))?.status,
        ).toBe("disabled");
      }),
  );

  it.effect(
    "rolls back policy, credential consumption, audit and notifications when required writes fail",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const database = yield* Database;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createRequiredSsoOrganization;
        const input = {
          expectedRevision: fixture.policy.revision,
          recoveryCredential: fixture.recovery.recoveryCredential,
        };
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.organization.authRecovery
                .recover(fixture.owner.actor, fixture.organization.id, input)
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(
          (yield* repository.organization.authPolicy.findByOrganizationId(fixture.organization.id))
            ?.ssoMode,
        ).toBe("required");
        expect(
          (yield* repository.organization.authRecoveryToken.findActiveByMember(
            fixture.organization.id,
            fixture.membership.id,
          ))?.id,
        ).toBe(fixture.recovery.id);
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectOrganizationSecurityEmail;
            expect(
              yield* application.organization.authRecovery
                .recover(fixture.owner.actor, fixture.organization.id, input)
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(
          (yield* repository.organization.authPolicy.findByOrganizationId(fixture.organization.id))
            ?.revision,
        ).toBe(fixture.policy.revision);
        expect(
          (yield* repository.organization.authRecoveryToken.findActiveByMember(
            fixture.organization.id,
            fixture.membership.id,
          ))?.id,
        ).toBe(fixture.recovery.id);
        const events = yield* database.$client<{
          count: number;
        }>`select count(*)::int as count from audit.event where event_type = 'organization.auth_recovered'`;
        expect(events[0]?.count).toBe(0);
        yield* application.organization.authRecovery.recover(
          fixture.owner.actor,
          fixture.organization.id,
          input,
        );
        const delivered = yield* database.$client<{
          count: number;
        }>`select count(*)::int as count from jobs.email where idempotency_key like ${`org-security:${fixture.organization.id}:sso-recovered:policy-${fixture.policy.revision + 1}:%`}`;
        expect(delivered[0]?.count).toBe(1);
      }),
  );

  it.effect("serializes concurrent recovery and restores normal organization access", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const fixture = yield* createRequiredSsoOrganization;
      const input = {
        expectedRevision: fixture.policy.revision,
        recoveryCredential: fixture.recovery.recoveryCredential,
      };
      const results = yield* Effect.all(
        [
          application.organization.authRecovery
            .recover(fixture.owner.actor, fixture.organization.id, input)
            .pipe(Effect.result),
          application.organization.authRecovery
            .recover(fixture.owner.actor, fixture.organization.id, input)
            .pipe(Effect.result),
        ],
        { concurrency: 2 },
      );
      expect(results.filter(Result.isSuccess)).toHaveLength(1);
      expect(results.find(Result.isFailure)?.failure).toMatchObject({
        code: "REVISION_CONFLICT",
      });
      expect(
        (yield* application.organization.organization.get(
          fixture.owner.actor,
          fixture.organization.id,
        )).access.isOwner,
      ).toBe(true);
    }),
  );
  it.effect(
    "serializes competing credential revocations so one prepared owner always remains",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const fixture = yield* createRequiredSsoOrganization;
        const next = yield* createTestIdentity("next@example.test", "Next Owner");
        const member = yield* admitTestMember(fixture.organization.id, next.actor.user.id);
        yield* Ref.update((yield* TestOidc).identity, (identity) => ({
          ...identity,
          subject: "second-owner",
        }));
        yield* linkTestOidc(next.actor, fixture.organization.id, fixture.connection.id);
        yield* application.organization.ownership.grant(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        yield* application.organization.authRecovery.rotate(next.actor, fixture.organization.id);
        const results = yield* Effect.all(
          [
            application.organization.authRecovery
              .revoke(fixture.owner.actor, fixture.organization.id)
              .pipe(Effect.result),
            application.organization.authRecovery
              .revoke(next.actor, fixture.organization.id)
              .pipe(Effect.result),
          ],
          { concurrency: 2 },
        );
        expect(results.filter(Result.isSuccess)).toHaveLength(1);
        expect(results.find(Result.isFailure)?.failure).toMatchObject({
          code: "LAST_AUTHENTICATION_PATH",
        });
        const first = yield* application.organization.authRecovery.get(
          fixture.owner.actor,
          fixture.organization.id,
        );
        const second = yield* application.organization.authRecovery.get(
          next.actor,
          fixture.organization.id,
        );
        expect(
          [first.credential, second.credential].filter((credential) => credential !== null),
        ).toHaveLength(1);
      }),
  );
});
