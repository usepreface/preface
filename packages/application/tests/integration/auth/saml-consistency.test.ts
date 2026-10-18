import { expect, layer } from "@effect/vitest";
import { Deferred, Effect, Fiber, Ref, Result } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { createTestOrganization } from "../../fixtures/organization.js";
import { TestSaml } from "../../fixtures/saml-provider.js";
import { configureTestSaml, linkTestSaml, samlCallbackInput } from "../../fixtures/saml.js";

layer(ApplicationTestLayer)("SAML transactional boundaries", (it) => {
  it.effect("rolls back explicit linking on audit failure and scrubs the staged identity", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const { owner, organization } = yield* createTestOrganization;
      const connection = yield* configureTestSaml(owner.actor, organization.id);
      const started = yield* application.auth.saml.startLink(
        owner.actor,
        organization.id,
        connection.id,
      );
      const staged = yield* application.auth.saml.callback(
        connection.id,
        samlCallbackInput(started),
      );
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* rejectLifecycleAudit;
          expect(
            yield* application.auth.saml
              .complete({ ...staged, browserToken: started.browserToken }, owner.actor)
              .pipe(Effect.flip),
          ).toMatchObject({ _tag: "DatabaseError" });
        }),
      );
      expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
      const flow = yield* repository.auth.authFlow.findById(staged.flowId);
      expect(flow?.revokedAt).not.toBeNull();
      expect(flow?.verifiedIdentityCiphertext).toBeNull();
      expect(
        yield* application.auth.saml
          .complete({ ...staged, browserToken: started.browserToken }, owner.actor)
          .pipe(Effect.flip),
      ).toMatchObject({ code: "INVALID_FLOW" });
    }),
  );

  it.effect(
    "admits one verification and observes trust revocation committed during verification",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestSaml(owner.actor, organization.id);
        const verifying = yield* Deferred.make<void>();
        const resume = yield* Deferred.make<void>();
        yield* Ref.set(
          (yield* TestSaml).gate,
          Deferred.succeed(verifying, undefined).pipe(Effect.andThen(Deferred.await(resume))),
        );
        const started = yield* application.auth.saml.startLink(
          owner.actor,
          organization.id,
          connection.id,
        );
        const input = samlCallbackInput(started);
        const first = yield* application.auth.saml
          .callback(connection.id, input)
          .pipe(Effect.result, Effect.forkChild);
        yield* Deferred.await(verifying);
        expect(
          yield* application.auth.saml.callback(connection.id, input).pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        yield* application.organization.identityConnection.disable(
          owner.actor,
          organization.id,
          connection.id,
          connection.revision,
        );
        yield* Deferred.succeed(resume, undefined);
        expect(yield* Fiber.join(first)).toMatchObject({
          _tag: "Failure",
          failure: { code: "CONNECTION_UNAVAILABLE" },
        });
        expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
      }),
  );
  it.effect(
    "commits one session when the same verified browser return completes concurrently",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestSaml(owner.actor, organization.id);
        yield* linkTestSaml(owner.actor, organization.id, connection.id);
        const started = yield* application.auth.saml.startSignIn(organization.id, connection.id);
        const staged = yield* application.auth.saml.callback(
          connection.id,
          samlCallbackInput(started),
        );
        const complete = application.auth.saml
          .complete({ ...staged, browserToken: started.browserToken })
          .pipe(Effect.result);
        const results = yield* Effect.all([complete, complete], { concurrency: "unbounded" });
        expect(results.filter(Result.isSuccess)).toHaveLength(1);
        expect(results.filter(Result.isFailure)).toMatchObject([
          { failure: { code: "INVALID_FLOW" } },
        ]);
        const { sessions } = yield* application.auth.session.list(owner.actor, {});
        expect(sessions).toHaveLength(2);
      }),
  );
});
