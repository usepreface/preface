import { DateTime, Effect, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { AuditCursor, IdentityError, type OrganizationId } from "@usepreface/protocol";
import {
  ListAuditEventsQuery,
  AuditExportQuery,
  type SessionActor,
} from "@usepreface/protocol/dto";

import { makeIdentityAccess } from "#/auth/identity-access";
import { OrganizationAccess } from "#/organization/access";

const csvCell = (value: string) =>
  `"${(/^[=+\-@\t\r\n]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;

export const makeAuditHistory = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const organizations = yield* OrganizationAccess;
  const instances = yield* makeIdentityAccess;
  const read = Effect.fn("AuditHistory.read")(function* (
    actor: SessionActor,
    organizationId: OrganizationId | null,
    input: ListAuditEventsQuery | AuditExportQuery,
    exporting: boolean,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(
      Schema.toType(exporting ? AuditExportQuery : ListAuditEventsQuery),
    )(input).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    if (organizationId === null) yield* instances.requireInstanceOwner(actor);
    else yield* organizations.requirePermissions(actor, organizationId, ["audit.read"]);
    const cursor =
      decoded.cursor === undefined
        ? undefined
        : yield* Schema.decodeUnknownEffect(Schema.fromJsonString(AuditCursor))(
            decoded.cursor,
          ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    if (
      decoded.after !== undefined &&
      decoded.before !== undefined &&
      DateTime.toEpochMillis(decoded.after) > DateTime.toEpochMillis(decoded.before)
    )
      return yield* new IdentityError({ code: "INVALID_INPUT" });
    const limit = exporting
      ? 1000
      : "limit" in decoded && typeof decoded.limit === "number"
        ? decoded.limit
        : 25;
    const rows = yield* repository.audit.event.list({
      organizationId,
      ...decoded,
      cursor,
      limit: limit + 1,
    });
    const events = rows.slice(0, limit);
    const last = events.at(-1);
    const nextCursor =
      rows.length > limit && last !== undefined
        ? Schema.encodeSync(Schema.fromJsonString(AuditCursor))({
            occurredAt: last.occurredAt,
            id: last.id,
          })
        : null;
    return { events, nextCursor };
  });
  const list = Effect.fn("Application.audit.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId | null,
    input: ListAuditEventsQuery = {},
  ) {
    return yield* read(actor, organizationId, input, false);
  });
  const exportCsv = Effect.fn("Application.audit.exportCsv")(function* (
    actor: SessionActor,
    organizationId: OrganizationId | null,
    input: AuditExportQuery = {},
  ) {
    const page = yield* read(actor, organizationId, input, true);
    const header =
      "id,occurredAt,eventType,actorKind,actorUserId,organizationId,targetType,targetId,metadata";
    const lines = page.events.map((event) =>
      [
        event.id,
        Schema.encodeSync(Schema.DateTimeUtcFromString)(event.occurredAt),
        event.eventType,
        event.actorKind,
        event.actorUserId ?? "",
        event.organizationId ?? "",
        event.targetType,
        String(event.targetId),
        JSON.stringify(event.metadata),
      ]
        .map(csvCell)
        .join(","),
    );
    return {
      contentType: "text/csv" as const,
      filename: organizationId === null ? "instance-audit.csv" : "organization-audit.csv",
      content: [header, ...lines].join("\r\n"),
      nextCursor: page.nextCursor,
    };
  });
  return { list, exportCsv };
});
