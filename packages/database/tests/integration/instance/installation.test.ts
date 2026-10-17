import { expect, layer } from "@effect/vitest";
import { DateTime, Effect } from "effect";

import { Database, InstanceRepository } from "../../../src/index.js";
import { instanceSettings } from "../../../src/schema/instance/settings.js";
import { TestDatabase } from "../../../src/testing/index.js";
import { InstanceTestLayer } from "../../fixtures/database.js";

layer(InstanceTestLayer)("installation persistence", (it) => {
  it.effect("initializes installation and defaults once without overwriting settings", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const first = yield* repository.initialize();
      expect(first.created).toBe(true);
      expect(first.settings.displayName).toBe("Preface");
      expect(first.settings.revision).toBe(1);
      expect(first.installation.bootstrapCompletedAt).toBeNull();
      expect(first.installation.bootstrapTokenHash).toBeNull();
      yield* repository.settings.update({ revision: 1, displayName: "Our Preface" });
      const second = yield* repository.initialize();
      expect(second.created).toBe(false);
      expect(second.installation.installationId).toBe(first.installation.installationId);
      expect(second.settings.displayName).toBe("Our Preface");
      expect(second.settings.revision).toBe(2);
      expect(yield* repository.owner.listActive()).toEqual([]);
    }),
  );

  it.effect("initializes one shared installation under concurrent startup", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      const results = yield* Effect.all([repository.initialize(), repository.initialize()], {
        concurrency: 2,
      });
      expect(results.filter((result) => result.created)).toHaveLength(1);
      expect(results[0]?.installation.installationId).toBe(results[1]?.installation.installationId);
      expect(yield* (yield* Database).select().from(instanceSettings)).toHaveLength(1);
    }),
  );

  it.effect("allows one settings edit per revision and uses the Effect clock", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const repository = yield* InstanceRepository;
      yield* repository.initialize();
      const now = yield* DateTime.now;
      const edits = yield* Effect.all(
        [
          repository.settings.update({ displayName: "First", revision: 1 }),
          repository.settings.update({ displayName: "Second", revision: 1 }),
        ],
        { concurrency: 2 },
      );
      expect(edits.filter((edited) => edited !== undefined)).toHaveLength(1);
      const current = yield* repository.settings.find();
      expect(current?.revision).toBe(2);
      expect(current === undefined ? undefined : DateTime.toEpochMillis(current.updatedAt)).toBe(
        DateTime.toEpochMillis(now),
      );
      expect(
        yield* repository.settings.update({ displayName: "Stale", revision: 1 }),
      ).toBeUndefined();
    }),
  );
});
