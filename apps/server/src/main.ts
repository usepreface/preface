#!/usr/bin/env node
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Cause, Effect } from "effect";
import { Command } from "effect/cli";

import { command } from "#/cli/command";

Command.run(command, { version: "0.1.0" }).pipe(
  Effect.provide(NodeServices.layer),
  Effect.catchCause((cause) =>
    Cause.hasInterruptsOnly(cause)
      ? Effect.interrupt
      : Effect.fail(
          new Error(
            "Preface command failed. Check the command, backend configuration and PostgreSQL availability.",
          ),
        ),
  ),
  NodeRuntime.runMain,
);
