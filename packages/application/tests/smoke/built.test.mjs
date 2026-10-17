import assert from "node:assert/strict";
import { test } from "node:test";

import { NodeCrypto } from "@effect/platform-node";
import { ConfigProvider, Effect, Layer, Predicate, Redacted, Schema } from "effect";

import { NodeSecretCrypto, NodeTokenCrypto } from "@usepreface/crypto/node";
import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";
import { EmailJobs, EmailPayloadCipher } from "@usepreface/emails";
import { RequestBootstrapVerificationInput, SessionActor } from "@usepreface/protocol";
import { EmailPayload } from "@usepreface/protocol/model";

import { Application, AuthenticationLinks } from "../../dist/index.js";
import { NodeToken, NodeGoogleIdentity } from "../../dist/node/index.js";

test("built application completes and revokes setup using packaged repositories and migrations", async () => {
  const persistence = DatabaseRepository.layer.pipe(Layer.provideMerge(TestDatabase.layer));
  const security = Layer.mergeAll(
    NodeToken.layer,
    NodeSecretCrypto.layer,
    NodeTokenCrypto.layer,
  ).pipe(
    Layer.provide(NodeCrypto.layer),
    Layer.provide(
      ConfigProvider.layer(
        ConfigProvider.fromUnknown({
          CRYPTO_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
          CRYPTO_HMAC_KEY: Buffer.alloc(32, 8).toString("base64"),
        }),
      ),
    ),
  );
  const application = Application.layer.pipe(
    Layer.provide(NodeGoogleIdentity.layer),
    Layer.provide(
      Layer.succeed(AuthenticationLinks, { publicOrigin: "https://preface.example.test" }),
    ),
    Layer.provideMerge(EmailJobs.layer.pipe(Layer.provideMerge(EmailPayloadCipher.layer))),
    Layer.provideMerge(persistence),
    Layer.provide(security),
  );

  await Effect.runPromise(
    Effect.gen(function* () {
      const app = yield* Application;
      const prepared = yield* app.instance.bootstrap.prepare();
      assert.equal(prepared.state, "issued");
      const input = Schema.decodeUnknownSync(RequestBootstrapVerificationInput)({
        token: Redacted.value(prepared.token),
        instanceName: "Preface",
        ownerName: "Instance Owner",
        email: "owner@example.test",
      });
      const verification = yield* app.instance.bootstrap.requestVerification(input);
      const repository = yield* DatabaseRepository;
      const challenge = yield* repository.instance.challenge.find();
      const job = yield* repository.jobs.email.findById(challenge.emailJobId);
      const payload = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(EmailPayload))(
        yield* (yield* EmailPayloadCipher).decrypt(job.encryptedPayload),
      );
      const completed = yield* app.instance.bootstrap.complete({
        token: prepared.token,
        challengeId: verification.challengeId,
        code: Redacted.make(payload.variables.code),
      });
      assert.deepEqual(yield* app.auth.session.resolve(completed.sessionToken), completed.actor);
      const response = Schema.encodeSync(SessionActor)(completed.actor);
      assert.equal(typeof response.user.emailVerifiedAt, "string");
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
