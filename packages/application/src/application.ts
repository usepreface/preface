import { Context, Effect, Layer } from "effect";

import { DatabaseMigration } from "@usepreface/database";

import { makeEmailSignInApplication } from "#/auth/email-sign-in";
import { makeSessionApplication } from "#/auth/session";
import { makeBootstrapApplication } from "#/instance/bootstrap";

const makeApplication = Effect.gen(function* () {
  yield* DatabaseMigration;
  const bootstrap = yield* makeBootstrapApplication;
  const emailSignIn = yield* makeEmailSignInApplication;
  const session = yield* makeSessionApplication;

  return { instance: { bootstrap }, auth: { session, emailSignIn } } as const;
});

export class Application extends Context.Service<
  Application,
  Effect.Success<typeof makeApplication>
>()("@usepreface/application/Application") {
  static readonly layer = Layer.effect(Application, makeApplication);
}
