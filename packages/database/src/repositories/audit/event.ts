import { Context, DateTime, Effect, Layer, Schema } from "effect";

import { AuditEvent, RecordAuditEvent } from "@usepreface/protocol/model";

import { mapToDatabaseError } from "#/core/errors";
import { Database } from "#/core/layer";
import { auditEvent } from "#/schema/audit/event";

const makeAuditEventRepository = Effect.gen(function* () {
  const database = yield* Database;
  const decode = Schema.decodeUnknownSync(AuditEvent);
  const encode = Schema.encodeSync(RecordAuditEvent);

  const append = Effect.fn("AuditEventRepository.append")(function* (input: RecordAuditEvent) {
    const encoded = encode(input);
    const occurredAt = DateTime.toDateUtc(yield* DateTime.now);

    const [row] = yield* database
      .insert(auditEvent)
      .values({
        ...encoded,
        actorUserId: input.actorUserId,
        targetId: input.targetId,
        metadata: input.metadata,
        occurredAt,
      })
      .returning();

    if (row === undefined)
      return yield* Effect.die(new Error("Audit event insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);

  return { append } as const;
});

export class AuditEventRepository extends Context.Service<
  AuditEventRepository,
  Effect.Success<typeof makeAuditEventRepository>
>()("@usepreface/database/repositories/audit/AuditEventRepository") {
  static readonly layer = Layer.effect(AuditEventRepository, makeAuditEventRepository);
}
