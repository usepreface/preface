import { expect, it } from "@effect/vitest";
import { Effect, Ref, Result } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { createTestInvitation } from "../../fixtures/invitation.js";
import { TestOidc } from "../../fixtures/oidc-provider.js";
import { configureTestOidc, oidcCallbackInput } from "../../fixtures/oidc.js";
import { createTestOrganization } from "../../fixtures/organization.js";

it.live.skipIf(process.env.PREFACE_TEST_POSTGRES_PORT === undefined)(
  "concurrent provider completions consume one invitation and create one membership",
  () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const { owner, organization } = yield* createTestOrganization;
      const firstConnection = yield* configureTestOidc(owner.actor, organization.id);
      const secondConnection = yield* configureTestOidc(owner.actor, organization.id);
      const policy = yield* application.organization.authPolicy.get(owner.actor, organization.id);
      yield* application.organization.authPolicy.update(owner.actor, organization.id, {
        expectedRevision: policy.revision,
        oidcConnectionIds: [firstConnection.id, secondConnection.id],
      });
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
      yield* application.organization.domain.bind(
        owner.actor,
        organization.id,
        secondConnection.id,
        {
          expectedRevision: secondConnection.revision,
          domainIds: [domain.id],
        },
      );
      const firstInvite = yield* createTestInvitation(
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
      const firstFlow = yield* application.auth.external.invitation.start({
        ...firstInvite.input,
        connectionId: firstConnection.id,
        displayName: "Alice",
      });
      const secondFlow = yield* application.auth.external.invitation.start({
        ...firstInvite.input,
        connectionId: secondConnection.id,
        displayName: "Alice",
      });
      const results = yield* Effect.all(
        [
          oidcCallbackInput(firstFlow).pipe(
            Effect.flatMap((input) => application.auth.oidc.callback(input)),
            Effect.result,
          ),
          oidcCallbackInput(secondFlow).pipe(
            Effect.flatMap((input) => application.auth.oidc.callback(input)),
            Effect.result,
          ),
        ],
        { concurrency: "unbounded" },
      );
      const successful = results.filter(Result.isSuccess);
      expect(successful).toHaveLength(1);
      const completed = successful[0]?.success;
      if (completed?.sessionToken === undefined) throw new Error("Expected completed session");
      const actor = yield* application.auth.session.resolve(completed.sessionToken);
      expect(
        yield* repository.organization.member.findByUserId(organization.id, actor.user.id),
      ).toMatchObject({ removedAt: null, suspendedAt: null });
      expect(yield* repository.auth.account.listByUserId(actor.user.id)).toHaveLength(1);
      expect(
        (yield* repository.organization.invitation.findById(
          organization.id,
          firstInvite.invitation.id,
        ))?.acceptedByUserId,
      ).toBe(actor.user.id);
    }).pipe(Effect.provide(ApplicationTestLayer)),
);
