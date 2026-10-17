import { Effect, Redacted, Schema } from "effect";

import { CompleteBootstrapInput } from "@usepreface/protocol";

import { Application } from "../../src/index.js";

export const bootstrapInput = (
  token: Redacted.Redacted<string>,
  overrides: Partial<Omit<typeof CompleteBootstrapInput.Encoded, "token">> = {},
) =>
  Schema.decodeUnknownEffect(CompleteBootstrapInput)({
    token: Redacted.value(token),
    instanceName: "Preface Test",
    ownerName: "First Owner",
    email: "owner@example.test",
    password: "a long test password",
    ...overrides,
  });

export const completeTestBootstrap = Effect.gen(function* () {
  const application = yield* Application;
  const prepared = yield* application.instance.bootstrap.prepare();
  if (prepared.state !== "issued")
    return yield* Effect.die(new Error("Fixture requires a fresh installation"));
  const input = yield* bootstrapInput(prepared.token);
  return yield* application.instance.bootstrap.complete(input);
});
