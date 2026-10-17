import { Effect, Redacted, Schema } from "effect";

import type { SessionActor } from "@usepreface/protocol/dto";
import { GoogleCallbackInput, SaveGoogleConnectionInput } from "@usepreface/protocol/input";

import { Application } from "../../src/index.js";

export const googleCallbackInput = (started: {
  readonly authorizationUrl: string;
  readonly browserToken: Redacted.Redacted<string>;
}) =>
  Schema.decodeUnknownEffect(GoogleCallbackInput)({
    state: new URL(started.authorizationUrl).searchParams.get("state"),
    browserToken: Redacted.value(started.browserToken),
    code: "test-authorization-code",
  });

export const configureTestGoogle = Effect.fnUntraced(function* (actor: SessionActor) {
  const application = yield* Application;
  const configuration = yield* application.instance.authentication.google.save(
    actor,
    yield* Schema.decodeUnknownEffect(SaveGoogleConnectionInput)({
      expectedRevision: 0,
      clientId: "preface-client.apps.googleusercontent.com",
      clientSecret: "fixture-client-secret",
    }),
  );
  const test = yield* application.instance.authentication.google.test(
    actor,
    configuration.revision,
  );
  yield* application.auth.google.callback(yield* googleCallbackInput(test), actor);
  return yield* application.instance.authentication.google.activate(actor, configuration.revision);
});

export const linkTestGoogle = Effect.fnUntraced(function* (actor: SessionActor) {
  const application = yield* Application;
  const started = yield* application.auth.account.startGoogle(actor);
  yield* application.auth.google.callback(yield* googleCallbackInput(started), actor);
  const accounts = yield* application.auth.account.list(actor);
  const account = accounts.accounts.find((candidate) => candidate.unlinkedAt === null);
  if (account === undefined) throw new Error("Expected linked Google account");
  return account;
});

export const signInTestGoogle = Effect.gen(function* () {
  const application = yield* Application;
  const started = yield* application.auth.google.start();
  const completed = yield* application.auth.google.callback(yield* googleCallbackInput(started));
  if (completed.sessionToken === undefined) throw new Error("Expected Google session token");
  return {
    sessionToken: completed.sessionToken,
    actor: yield* application.auth.session.resolve(completed.sessionToken),
  };
});
