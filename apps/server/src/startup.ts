import { Context, Effect, Layer } from "effect";

import { Application } from "@usepreface/application";
import { DatabaseMigration } from "@usepreface/database";

import { writeSetupPreparation } from "#/operator/setup-link";

export class Startup extends Context.Service<Startup, { readonly completed: true }>()(
  "@usepreface/server/Startup",
) {
  static readonly layer = Layer.effect(
    Startup,
    Effect.gen(function* () {
      yield* DatabaseMigration;
      const application = yield* Application;
      yield* writeSetupPreparation(yield* application.instance.bootstrap.prepare());
      return Startup.of({ completed: true });
    }),
  );
}
