import { Effect, Redacted, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { RequestEmailSignInInput } from "@usepreface/protocol/input";

import { Application } from "../../src/index.js";
import { readEmailJob } from "./email-job.js";

export const requestEmailProof = Effect.fnUntraced(function* (email = "owner@example.test") {
  const issued = yield* (yield* Application).auth.emailSignIn.request(
    yield* Schema.decodeUnknownEffect(RequestEmailSignInInput)({ email }),
  );
  const proof = yield* (yield* DatabaseRepository).auth.verification.findById(
    issued.challenge.challengeId,
  );
  if (proof?.emailJobId === null || proof?.emailJobId === undefined)
    return yield* Effect.die(new Error("Expected a sign-in email job"));
  const payload = yield* readEmailJob(proof.emailJobId);
  if (payload.type !== "sign-in") return yield* Effect.die(new Error("Expected sign-in email"));
  if (payload.variables.magicLinkUrl === undefined)
    return yield* Effect.die(new Error("Expected magic link"));
  const token = new URLSearchParams(new URL(payload.variables.magicLinkUrl).hash.slice(1)).get(
    "token",
  );
  if (token === null) return yield* Effect.die(new Error("Expected a magic-link token"));
  return {
    challengeId: issued.challenge.challengeId,
    browserToken: issued.browserToken,
    code: Redacted.make(payload.variables.code),
    token: Redacted.make(token),
    expiresAt: issued.challenge.expiresAt,
  };
});

export const signInTestUser = Effect.fnUntraced(function* (email = "owner@example.test") {
  const proof = yield* requestEmailProof(email);
  return yield* (yield* Application).auth.emailSignIn.verify({ ...proof, method: "code" });
});
