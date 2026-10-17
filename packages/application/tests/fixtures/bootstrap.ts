import { Effect, Redacted, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { EmailPayloadCipher } from "@usepreface/emails";
import { RequestBootstrapVerificationInput } from "@usepreface/protocol/input";
import { EmailPayload } from "@usepreface/protocol/model";

import { Application } from "../../src/index.js";

export const bootstrapInput = (
  token: Redacted.Redacted<string>,
  overrides: Partial<Omit<typeof RequestBootstrapVerificationInput.Encoded, "token">> = {},
) =>
  Schema.decodeUnknownEffect(RequestBootstrapVerificationInput)({
    token: Redacted.value(token),
    instanceName: "Preface Test",
    ownerName: "First Owner",
    email: "owner@example.test",
    ...overrides,
  });

export const pendingSetupCode = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const challenge = yield* repository.instance.challenge.find();
  if (challenge === undefined)
    return yield* Effect.die(new Error("Expected a verification challenge"));
  const job = yield* repository.jobs.email.findById(challenge.emailJobId);
  if (job === undefined || job.encryptedPayload === null)
    return yield* Effect.die(new Error("Expected a queued email"));
  const payload = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(EmailPayload))(
    yield* (yield* EmailPayloadCipher).decrypt(job.encryptedPayload),
  );
  if (payload.type !== "instance-setup")
    return yield* Effect.die(new Error("Expected setup email"));
  return Redacted.make(payload.variables.code);
});

export const verificationInput = (token: Redacted.Redacted<string>) =>
  Effect.gen(function* () {
    const verification = yield* (yield* Application).instance.bootstrap.requestVerification(
      yield* bootstrapInput(token),
    );
    return { token, challengeId: verification.challengeId, code: yield* pendingSetupCode };
  });

export const completeTestBootstrap = Effect.gen(function* () {
  const application = yield* Application;
  const prepared = yield* application.instance.bootstrap.prepare();
  if (prepared.state !== "issued")
    return yield* Effect.die(new Error("Fixture requires a fresh installation"));
  return yield* application.instance.bootstrap.complete(yield* verificationInput(prepared.token));
});
