import { Console, DateTime, Effect, Redacted } from "effect";

import { Application } from "@usepreface/application";
import type { BootstrapPreparation } from "@usepreface/application";

import { ServerConfig } from "#/config";

export const writeSetupPreparation = Effect.fn("operator.writeSetupPreparation")(function* (
  prepared: BootstrapPreparation,
) {
  if (prepared.state === "ready") {
    yield* Effect.logInfo("Instance setup is complete");
    return;
  }
  if (prepared.state === "pending") {
    yield* Effect.logInfo("An existing setup link remains valid", {
      expiresAt: DateTime.formatIso(prepared.expiresAt),
    });
    yield* Console.log("To replace a lost setup link, run: preface instance setup-link reissue");
    return;
  }

  const config = yield* ServerConfig;
  const url = new URL("/setup", config.publicUrl);
  url.hash = new URLSearchParams({ token: Redacted.value(prepared.token) }).toString();

  // Supported one-time operator output, emitted only after its issuance transaction committed.
  yield* Console.log(
    `Preface setup link (expires ${DateTime.formatIso(prepared.expiresAt)}):\n${url.toString()}`,
  );
});

export const reissueSetupLink = Effect.gen(function* () {
  const application = yield* Application;
  const prepared = yield* application.instance.bootstrap.reissueToken();
  yield* writeSetupPreparation(prepared);
});
