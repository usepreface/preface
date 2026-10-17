import { expect, it } from "@effect/vitest";
import { Cause, Effect, Exit, Option, Result } from "effect";
import { SqlError } from "effect/sql";

import { EffectDrizzleQueryError } from "drizzle-orm/effect-core";

import { DatabaseError, mapToDatabaseError } from "../../src/core/errors.js";

it.effect("preserves the complete wrapped error and structured retry classification", () =>
  Effect.gen(function* () {
    const reason = new SqlError.SerializationError({ cause: new Error("Concurrent write") });
    const original = new EffectDrizzleQueryError({
      query: "select $1",
      params: ["sensitive-test-value"],
      cause: Cause.fail(new SqlError.SqlError({ reason })),
    });
    const mapped = yield* Effect.fail(original).pipe(mapToDatabaseError, Effect.flip);

    expect(mapped.cause).toBe(original);
    expect(mapped.reason).toBe(reason);
    expect(mapped.isRetryable).toBe(true);
    expect(mapped.message).toBe("Database operation failed");
  }),
);

it.effect("passes domain errors and already-mapped errors through unchanged", () =>
  Effect.gen(function* () {
    const domainFailure = { _tag: "AlreadyBootstrapped" } as const;
    const mapped = new DatabaseError({ cause: new Error("Connection refused") });
    expect(yield* Effect.fail(domainFailure).pipe(mapToDatabaseError, Effect.flip)).toBe(
      domainFailure,
    );
    expect(yield* Effect.fail(mapped).pipe(mapToDatabaseError, Effect.flip)).toBe(mapped);
  }),
);

it.effect("does not convert defects or interruption to recoverable failures", () =>
  Effect.gen(function* () {
    const defect = new Error("Programming failure");
    const defectExit = yield* Effect.die(defect).pipe(mapToDatabaseError, Effect.exit);
    expect(Exit.isFailure(defectExit)).toBe(true);
    if (Exit.isFailure(defectExit)) {
      expect(Cause.findDefect(defectExit.cause)).toEqual(Result.succeed(defect));
      expect(Cause.findErrorOption(defectExit.cause)).toEqual(Option.none());
    }

    const interrupted = yield* Effect.interrupt.pipe(mapToDatabaseError, Effect.exit);
    expect(Exit.isFailure(interrupted)).toBe(true);
    if (Exit.isFailure(interrupted)) expect(Cause.hasInterrupts(interrupted.cause)).toBe(true);
  }),
);
