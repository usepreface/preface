import { DateTime, Effect, Redacted } from "effect";

import { Application } from "@usepreface/application";
import { DatabaseRepository } from "@usepreface/database";

import { prepareTestInstance } from "./backend.js";
import { readEmailJob } from "./email-job.js";
import { pendingSetupCode } from "./setup-code.js";

export const completeTestSetup = Effect.gen(function* () {
  const prepared = yield* prepareTestInstance;
  const application = yield* Application;
  const verification = yield* application.instance.bootstrap.requestVerification({
    token: prepared.token,
    instanceName: "Knowledge",
    ownerName: "Owner",
    email: "owner@example.test",
  });
  return yield* application.instance.bootstrap.complete({
    token: prepared.token,
    challengeId: verification.challengeId,
    code: yield* pendingSetupCode,
  });
});

export const createSignedInTestUser = Effect.fnUntraced(function* (email: string) {
  const repository = yield* DatabaseRepository;
  const application = yield* Application;
  const user = yield* repository.auth.user.create({ displayName: "Colleague" });
  yield* repository.auth.userEmail.create({
    userId: user.id,
    email,
    isPrimary: true,
    loginEnabled: true,
    verifiedAt: yield* DateTime.now,
  });
  const issued = yield* application.auth.emailSignIn.request({ email });
  const proof = yield* repository.auth.verification.findById(issued.challenge.challengeId);
  if (proof?.emailJobId === null || proof?.emailJobId === undefined)
    return yield* Effect.die(new Error("Expected sign-in job"));
  const payload = yield* readEmailJob(proof.emailJobId);
  if (payload.type !== "sign-in") return yield* Effect.die(new Error("Expected sign-in email"));
  return yield* application.auth.emailSignIn.verify({
    challengeId: issued.challenge.challengeId,
    browserToken: issued.browserToken,
    method: "code",
    code: Redacted.make(payload.variables.code),
  });
});
