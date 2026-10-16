import { Effect, Option, Schema } from "effect";

import { InstanceStateError } from "@usepreface/protocol";
import { Installation } from "@usepreface/protocol/model";
import { eq } from "drizzle-orm";

import type { DatabaseService } from "#/core/layer";
import { installation } from "#/schema/instance/installation";

// Owner mutations and bootstrap workflows share this lock to serialize installation-wide changes.
export const lockInstallation = Effect.fnUntraced(function* (database: DatabaseService) {
  const active = yield* Effect.serviceOption(database.$client.transactionService);
  if (Option.isNone(active)) {
    return yield* Effect.die(new Error("Installation locking requires TransactionService.run"));
  }
  const [row] = yield* database
    .select()
    .from(installation)
    .where(eq(installation.id, 1))
    .for("update");
  if (row === undefined) return yield* new InstanceStateError({ code: "NOT_INITIALIZED" });
  return Schema.decodeSync(Installation)(row);
});
