import { expect, layer } from "@effect/vitest";
import { Deferred, Effect, Fiber, Ref } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { TestOidc } from "../../fixtures/oidc-provider.js";
import { configureTestOidc, oidcCallbackInput } from "../../fixtures/oidc.js";
import { createTestOrganization } from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("OIDC transaction and revocation boundaries", (it) => {
  it.effect(
    "rolls back linking on required-audit failure, scrubs the flow and rejects replay",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const started = yield* application.auth.oidc.startLink(
          owner.actor,
          organization.id,
          connection.id,
        );
        const input = yield* oidcCallbackInput(started);
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.auth.oidc.callback(input, owner.actor).pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
        const repository = yield* DatabaseRepository;
        const stateHash = yield* (yield* TokenCrypto).digestToken({
          purpose: cryptoPurpose.authFlowState,
          token: input.state,
        });
        const flow = yield* repository.auth.authFlow.findByStateHash(stateHash);
        expect(flow?.revokedAt).not.toBeNull();
        expect(flow?.pkceVerifierCiphertext).toBeNull();
        expect(
          yield* application.auth.oidc.callback(input, owner.actor).pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
      }),
  );

  it.effect(
    "claims one callback and observes connection disablement committed during remote exchange",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const provider = yield* TestOidc;
        const exchanging = yield* Deferred.make<void>();
        const resume = yield* Deferred.make<void>();
        yield* Ref.set(
          provider.gate,
          Deferred.succeed(exchanging, undefined).pipe(Effect.andThen(Deferred.await(resume))),
        );
        const started = yield* application.auth.oidc.startLink(
          owner.actor,
          organization.id,
          connection.id,
        );
        const input = yield* oidcCallbackInput(started);
        const first = yield* application.auth.oidc
          .callback(input, owner.actor)
          .pipe(Effect.result, Effect.forkChild);
        yield* Deferred.await(exchanging);
        expect(
          yield* application.auth.oidc.callback(input, owner.actor).pipe(Effect.flip),
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
  it.effect("rolls back policy relation replacement when its required audit cannot commit", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const { owner, organization } = yield* createTestOrganization;
      const connection = yield* configureTestOidc(owner.actor, organization.id);
      const before = yield* application.organization.authPolicy.get(owner.actor, organization.id);
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* rejectLifecycleAudit;
          expect(
            yield* application.organization.authPolicy
              .update(owner.actor, organization.id, {
                expectedRevision: before.revision,
                oidcConnectionIds: [],
              })
              .pipe(Effect.flip),
          ).toMatchObject({ _tag: "DatabaseError" });
        }),
      );
      const after = yield* application.organization.authPolicy.get(owner.actor, organization.id);
      expect(after.revision).toBe(before.revision);
      expect(after.oidcConnectionIds).toEqual([connection.id]);
    }),
  );
});
