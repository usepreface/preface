import { Effect, Redacted } from "effect";

import { DatabaseRepository } from "@usepreface/database";

import { readEmailJob } from "./email-job.js";

export const pendingSetupCode = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const challenge = yield* repository.instance.challenge.find();
  if (challenge === undefined)
    return yield* Effect.die(new Error("Expected a verification challenge"));
  const payload = yield* readEmailJob(challenge.emailJobId);
  if (payload.type !== "instance-setup")
    return yield* Effect.die(new Error("Expected setup email"));
  return Redacted.make(payload.variables.code);
});
