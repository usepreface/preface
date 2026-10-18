import { NodeCrypto } from "@effect/platform-node";
import { ConfigProvider, DateTime, Effect, Layer } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import {
  EmailDelivery,
  EmailJobs,
  EmailRenderer,
  EmailSender,
  EmailService,
  type EnqueueEmail,
} from "../../src/index.js";
import { NodeEmailPayloadCipher } from "../../src/node/index.js";
import { TestEmails } from "../../src/testing/index.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;
const database: Layer.Layer<Layer.Success<typeof TestDatabase.layer>, unknown> = port === undefined
  ? TestDatabase.layer
  : TestDatabase.postgresLayer(Number(port), process.env.PREFACE_TEST_POSTGRES_PASSWORD);
const repositories = DatabaseRepository.layer.pipe(Layer.provideMerge(database));

// Test-only renderer: real React Email templates are intentionally outside this change.
export const FixtureRenderer = Layer.succeed(
  EmailRenderer,
  EmailRenderer.of({
    render: (payload) =>
      Effect.succeed({
        subject: `Fixture: ${payload.type}`,
        html: "<p>Test fixture</p>",
        text:
          payload.type === "organization-security"
            ? payload.variables.action
            : "code" in payload.variables
              ? payload.variables.code
              : payload.variables.invitationUrl,
      }),
  }),
);

const cipher = NodeEmailPayloadCipher.layer.pipe(
  Layer.provide(NodeCrypto.layer),
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({
        EMAIL_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
        CRYPTO_HMAC_KEY: Buffer.alloc(32, 8).toString("base64"),
      }),
    ),
  ),
);

export const EmailTestLayer = Layer.mergeAll(EmailJobs.layer, EmailDelivery.layer).pipe(
  Layer.provideMerge(
    EmailService.layer.pipe(
      Layer.provide(FixtureRenderer),
      Layer.provide(
        Layer.succeed(EmailSender, { from: "Preface <preface@example.test>", replyTo: undefined }),
      ),
    ),
  ),
  Layer.provideMerge(TestEmails.layer),
  Layer.provideMerge(cipher),
  Layer.provideMerge(repositories),
  Layer.provide(NodeCrypto.layer),
);

export const signInEmail = Effect.gen(function* (): Effect.fn.Return<
  Extract<EnqueueEmail, { readonly type: "sign-in" }>
> {
  const expiresAt = DateTime.addDuration(yield* DateTime.now, "10 minutes");
  return {
    type: "sign-in",
    to: "operator@example.test",
    variables: { instanceName: "Preface Test", code: "48271936", expiresAt },
    idempotencyKey: "sign-in:test-challenge",
    expiresAt,
  };
});
