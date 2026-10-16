import { Context, DateTime, Effect, Layer, Schema } from "effect";

import { InstanceStateError } from "@usepreface/protocol";
import { InstanceSettings, UpdateInstanceSettings } from "@usepreface/protocol/model";
import { and, eq, sql } from "drizzle-orm";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { instanceSettings } from "#/schema/instance/settings";

const makeSettingsRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeSync(InstanceSettings);

  const find = Effect.fn("InstanceSettingsRepository.find")(function* () {
    const [row] = yield* database
      .select()
      .from(instanceSettings)
      .where(eq(instanceSettings.installationId, 1));
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  const initialize = Effect.fn("InstanceSettingsRepository.initialize")(function* () {
    const [inserted] = yield* database
      .insert(instanceSettings)
      .values({ installationId: 1 })
      .onConflictDoNothing({ target: instanceSettings.installationId })
      .returning();
    if (inserted !== undefined) return decode(inserted);
    const current = yield* find();
    if (current === undefined) return yield* new InstanceStateError({ code: "NOT_INITIALIZED" });
    return current;
  }, mapToDatabaseError);

  const update = Effect.fn("InstanceSettingsRepository.update")(function* (
    input: UpdateInstanceSettings,
  ) {
    const encoded = Schema.encodeSync(UpdateInstanceSettings)(input);
    const [row] = yield* database
      .update(instanceSettings)
      .set({
        displayName: encoded.displayName,
        revision: sql`${instanceSettings.revision} + 1`,
        updatedAt: DateTime.toDateUtc(yield* DateTime.now),
      })
      .where(
        and(
          eq(instanceSettings.installationId, 1),
          eq(instanceSettings.revision, encoded.revision),
        ),
      )
      .returning();
    return row === undefined ? undefined : decode(row);
  }, mapToDatabaseError);

  return { find, initialize, update };
});

export class InstanceSettingsRepository extends Context.Service<
  InstanceSettingsRepository,
  Effect.Success<typeof makeSettingsRepository>
>()("@usepreface/database/repositories/instance/InstanceSettingsRepository") {
  static readonly layer = Layer.effect(InstanceSettingsRepository, makeSettingsRepository);
}
