import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { TestClock } from "effect/testing";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";
import {
  configureTestGoogle,
  googleCallbackInput,
  linkTestGoogle,
  signInTestGoogle,
} from "../../fixtures/google.js";
import { admitTestMember, createTestIdentity } from "../../fixtures/organization.js";

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
        yield* admitTestMember(
          yield* application.organization.organization.currentId(),
          other.actor.user.id,
        );
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
    "an older owner session can manage providers and linked accounts without email step-up",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const owner = yield* completeTestBootstrap;
        const config = yield* configureTestGoogle(owner.actor);
        const account = yield* linkTestGoogle(owner.actor);
        const google = yield* signInTestGoogle;
        yield* TestClock.adjust("6 minutes");
        yield* application.instance.authentication.google.get(google.actor);
        yield* application.auth.account.unlink(google.actor, account.id);
        expect(
          yield* application.auth.session.resolve(google.sessionToken).pipe(Effect.flip),
        ).toMatchObject({ code: "UNAUTHENTICATED" });
        expect((yield* application.auth.session.resolve(owner.sessionToken)).user.id).toBe(
          owner.actor.user.id,
        );
        yield* application.instance.authentication.google.disable(owner.actor, config.revision);
      }),
  );
});
