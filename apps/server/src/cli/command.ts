import { Effect, Layer } from "effect";
import { CliError, Command } from "effect/cli";

import { reissueSetupLink } from "#/operator/setup-link";
import { BackendLive } from "#/runtime";
import { ServerLive } from "#/server";

const serve = Command.make("serve", {}, () => Layer.launch(ServerLive)).pipe(
  Command.withDescription("Migrate, prepare the instance, and serve the Preface HTTP API."),
);
const reissue = Command.make("reissue", {}, () =>
  reissueSetupLink.pipe(
    Effect.provide(BackendLive),
    Effect.catchTag("BootstrapError", (cause) =>
      Effect.fail(
        new CliError.UserError({
          cause,
          userMessage: "Instance setup is already complete; a setup link cannot be reissued.",
        }),
      ),
    ),
  ),
).pipe(Command.withDescription("Replace the current setup proof and print its new link."));

const setupLink = Command.make("setup-link").pipe(Command.withSubcommands([reissue]));
const instance = Command.make("instance").pipe(Command.withSubcommands([setupLink]));

export const command = Command.make("preface").pipe(
  Command.withDescription("Preface backend and instance operator commands."),
  Command.withSubcommands([serve, instance]),
);
