import { Cause, Effect, Schema } from "effect";
import { SqlError } from "effect/sql";

import {
  EffectDrizzleError,
  EffectDrizzleQueryError,
  EffectTransactionRollbackError,
  MigratorInitError,
} from "drizzle-orm/effect-core";

export class DatabaseError extends Schema.TaggedError<DatabaseError>()("DatabaseError", {
  cause: Schema.Defect(),
  reason: Schema.optional(SqlError.SqlErrorReason),
}) {
  override readonly message = "Database operation failed";

  get isRetryable(): boolean {
    return this.reason?.isRetryable ?? false;
  }
}

type KnownDrizzleError =
  | EffectDrizzleError
  | EffectDrizzleQueryError
  | EffectTransactionRollbackError
  | MigratorInitError;

type KnownDatabaseError = SqlError.SqlError | KnownDrizzleError;

const isKnownDrizzleError = (error: unknown): error is KnownDrizzleError =>
  error instanceof EffectDrizzleError ||
  error instanceof EffectDrizzleQueryError ||
  error instanceof EffectTransactionRollbackError ||
  error instanceof MigratorInitError;

const isKnownDatabaseError = (error: unknown): error is KnownDatabaseError =>
  SqlError.isSqlError(error) || isKnownDrizzleError(error);

const sqlReason = (error: unknown): SqlError.SqlErrorReason | undefined => {
  if (SqlError.isSqlError(error)) return error.reason;

  // Drizzle wraps a failed query's SqlError in an Effect Cause.
  if (Cause.isCause(error)) {
    for (const failure of error.reasons) {
      if (!Cause.isFailReason(failure)) continue;
      const reason = sqlReason(failure.error);
      if (reason !== undefined) return reason;
    }
  }

  if (error instanceof EffectDrizzleError || error instanceof EffectDrizzleQueryError) {
    return sqlReason(error.cause);
  }

  return undefined;
};

export type MapDatabaseError<E> = Exclude<E, KnownDatabaseError> | DatabaseError;

export const mapToDatabaseError = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, MapDatabaseError<E>, R> => {
  const isUnmappedError = (error: E): error is Exclude<E, KnownDatabaseError> =>
    !isKnownDatabaseError(error);

  return Effect.mapError(effect, (cause): MapDatabaseError<E> => {
    if (isUnmappedError(cause)) return cause;
    return new DatabaseError({ cause, reason: sqlReason(cause) });
  });
};
