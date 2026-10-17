import { Effect, Redacted, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { EmailPayloadCipher } from "@usepreface/emails";
import { EmailPayload } from "@usepreface/protocol/model";

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
