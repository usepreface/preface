import assert from "node:assert/strict";
import { test } from "node:test";

import { NodeCrypto } from "@effect/platform-node";
import { Effect, Layer, Predicate, Redacted, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";
import { CompleteBootstrapInput, SessionActor } from "@usepreface/protocol";

import { Application } from "../../dist/index.js";
import { NodePassword, NodeToken } from "../../dist/node/index.js";

test("built application completes and revokes setup using packaged repositories and migrations", async () => {
  const persistence = DatabaseRepository.layer.pipe(Layer.provideMerge(TestDatabase.layer));
  const security = Layer.mergeAll(NodePassword.layer, NodeToken.layer).pipe(
    Layer.provide(NodeCrypto.layer),
  );
  const application = Application.layer.pipe(Layer.provide(persistence), Layer.provide(security));

  await Effect.runPromise(
    Effect.gen(function* () {
      const app = yield* Application;
      const prepared = yield* app.instance.bootstrap.prepare();
      assert.equal(prepared.state, "issued");
      const input = Schema.decodeUnknownSync(CompleteBootstrapInput)({
        token: Redacted.value(prepared.token),
        instanceName: "Preface",
        ownerName: "Instance Owner",
        email: "owner@example.test",
        password: "a long test password",
      });
      const completed = yield* app.instance.bootstrap.complete(input);
      assert.deepEqual(yield* app.auth.session.resolve(completed.sessionToken), completed.actor);
      const response = Schema.encodeSync(SessionActor)(completed.actor);
      assert.equal(response.user.emailVerifiedAt, null);
      assert.equal(typeof response.session.expiresAt, "string");
      assert.equal(
        JSON.stringify(response).includes(Redacted.value(completed.sessionToken)),
        false,
      );
      yield* app.auth.session.revokeCurrent(completed.actor);
      const failure = yield* app.auth.session.resolve(completed.sessionToken).pipe(Effect.flip);
      assert.ok(Predicate.isTagged(failure, "AuthenticationError"));
    }).pipe(Effect.provide(application)),
  );
});
