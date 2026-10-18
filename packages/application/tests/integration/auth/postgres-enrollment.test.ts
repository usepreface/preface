import { expect, it } from "@effect/vitest";
import { Effect, Ref } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { createTestInvitation } from "../../fixtures/invitation.js";
import { TestOidc } from "../../fixtures/oidc-provider.js";
import { configureTestOidc, oidcCallbackInput } from "../../fixtures/oidc.js";
import { createTestOrganization } from "../../fixtures/organization.js";

it.live.skipIf(process.env.PREFACE_TEST_POSTGRES_PORT === undefined)(
  "concurrent invitations across organizations resolve one installation-wide user and preserve both admissions",
  () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const { owner, organization } = yield* createTestOrganization;
      const second = yield* application.organization.organization.create(owner.actor, {
        metadata: { name: "Second" },
        slug: "second",
      });
      const firstConnection = yield* configureTestOidc(owner.actor, organization.id);
      const secondConnection = yield* configureTestOidc(owner.actor, second.organization.id);
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
      yield* application.organization.domain.bind(
        owner.actor,
        organization.id,
        firstConnection.id,
        { expectedRevision: firstConnection.revision, domainIds: [domain.id] },
      );
      const secondDomain = yield* application.organization.domain.create(
        owner.actor,
        second.organization.id,
        { domain: "company.example.test" },
      );
      yield* application.organization.domain.verify(
        owner.actor,
        second.organization.id,
        secondDomain.id,
        secondDomain.revision,
        "operator",
      );
      yield* application.organization.domain.bind(
        owner.actor,
        second.organization.id,
        secondConnection.id,
        { expectedRevision: secondConnection.revision, domainIds: [secondDomain.id] },
      );
      const firstInvite = yield* createTestInvitation(
        owner.actor,
        organization.id,
        "alice@company.example.test",
      );
      const secondInvite = yield* createTestInvitation(
        owner.actor,
        second.organization.id,
        "alice@company.example.test",
      );
      yield* Ref.set((yield* TestOidc).identity, {
        issuer: "https://identity.example.test",
        subject: "employee-alice",
        email: "alice@company.example.test",
        emailVerified: false,
      });
      const firstFlow = yield* application.auth.external.invitation.start({
        ...firstInvite.input,
        connectionId: firstConnection.id,
        displayName: "Alice",
      });
      const secondFlow = yield* application.auth.external.invitation.start({
        ...secondInvite.input,
        connectionId: secondConnection.id,
        displayName: "Alice",
      });
      const [first, other] = yield* Effect.all(
        [
          oidcCallbackInput(firstFlow).pipe(
            Effect.flatMap((input) => application.auth.oidc.callback(input)),
          ),
          oidcCallbackInput(secondFlow).pipe(
            Effect.flatMap((input) => application.auth.oidc.callback(input)),
          ),
        ],
        { concurrency: "unbounded" },
      );
      if (first.sessionToken === undefined || other.sessionToken === undefined)
        throw new Error("Expected both completed sessions");
      const firstActor = yield* application.auth.session.resolve(first.sessionToken);
      const secondActor = yield* application.auth.session.resolve(other.sessionToken);
      expect(firstActor.user.id).toBe(secondActor.user.id);
      expect(
        yield* repository.organization.member.findByUserId(organization.id, firstActor.user.id),
      ).toMatchObject({ removedAt: null, suspendedAt: null });
      expect(
        yield* repository.organization.member.findByUserId(
          second.organization.id,
          firstActor.user.id,
        ),
      ).toMatchObject({ removedAt: null, suspendedAt: null });
      expect(
        (yield* repository.auth.account.listByUserId(firstActor.user.id))
          .map((account) => account.identityConnectionId)
          .toSorted(),
      ).toEqual([firstConnection.id, secondConnection.id].toSorted());
      expect(
        (yield* repository.organization.invitation.findById(
          organization.id,
          firstInvite.invitation.id,
        ))?.acceptedByUserId,
      ).toBe(firstActor.user.id);
      expect(
        (yield* repository.organization.invitation.findById(
          second.organization.id,
          secondInvite.invitation.id,
        ))?.acceptedByUserId,
      ).toBe(firstActor.user.id);
    }).pipe(Effect.provide(ApplicationTestLayer)),
);
