import { Context, DateTime, Effect, Layer, Schema } from "effect";

import type { AuditEventId, OrganizationId, UserId } from "@usepreface/protocol";
import { AuditEvent, RecordAuditEvent } from "@usepreface/protocol/model";
import { and, desc, eq, gte, inArray, isNull, like, lt, lte, or, sql } from "drizzle-orm";

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
        organizationId: "organizationId" in input ? input.organizationId : null,
        targetId: input.targetId,
        metadata: input.metadata,
        occurredAt,
      })
      .returning();

    if (row === undefined)
      return yield* Effect.die(new Error("Audit event insert returned no row"));
    return decode(row);
  }, mapToDatabaseError);

  const list = Effect.fn("AuditEventRepository.list")(function* (input: {
    readonly organizationId: OrganizationId | null;
    readonly limit: number;
    readonly cursor?: { readonly occurredAt: DateTime.Utc; readonly id: AuditEventId } | undefined;
    readonly eventType?: string;
    readonly actorUserId?: UserId;
    readonly targetId?: string;
    readonly after?: DateTime.Utc;
    readonly before?: DateTime.Utc;
  }) {
    const instanceEvents = and(
      isNull(auditEvent.organizationId),
      or(
        like(auditEvent.eventType, "instance.%"),
        inArray(auditEvent.eventType, [
          "auth.connection_configured",
          "auth.connection_tested",
          "auth.connection_activated",
          "auth.connection_disabled",
        ]),
      ),
    );
    const operatorApprovals = and(
      inArray(auditEvent.eventType, [
        "organization.domain_verified",
        "organization.domain_revoked",
      ]),
      sql`${auditEvent.metadata}->>'method' = 'operator'`,
    );
    const scope =
      input.organizationId === null
        ? or(instanceEvents, operatorApprovals)
        : eq(auditEvent.organizationId, input.organizationId);
    const cursor = input.cursor;
    const rows = yield* database
      .select()
      .from(auditEvent)
      .where(
        and(
          scope,
          input.eventType === undefined
            ? undefined
            : eq(auditEvent.eventType, input.eventType as AuditEvent["eventType"]),
          input.actorUserId === undefined
            ? undefined
            : eq(auditEvent.actorUserId, input.actorUserId),
          input.targetId === undefined
            ? undefined
            : eq(auditEvent.targetId, input.targetId as AuditEvent["targetId"]),
          input.after === undefined
            ? undefined
            : gte(auditEvent.occurredAt, DateTime.toDateUtc(input.after)),
          input.before === undefined
            ? undefined
            : lte(auditEvent.occurredAt, DateTime.toDateUtc(input.before)),
          cursor === undefined
            ? undefined
            : or(
                lt(auditEvent.occurredAt, DateTime.toDateUtc(cursor.occurredAt)),
                and(
                  eq(auditEvent.occurredAt, DateTime.toDateUtc(cursor.occurredAt)),
                  lt(auditEvent.id, cursor.id),
                ),
              ),
        ),
      )
      .orderBy(desc(auditEvent.occurredAt), desc(auditEvent.id))
      .limit(input.limit);
    return rows.map((row) => decode(row));
  }, mapToDatabaseError);
  return { append, list } as const;
});

export class AuditEventRepository extends Context.Service<
  AuditEventRepository,
  Effect.Success<typeof makeAuditEventRepository>
>()("@usepreface/database/repositories/audit/AuditEventRepository") {
  static readonly layer = Layer.effect(AuditEventRepository, makeAuditEventRepository);
}
