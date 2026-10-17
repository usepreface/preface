import { Schema } from "effect";

export const AuditEventId = Schema.String.check(Schema.isUUID(7)).pipe(
  Schema.brand("AuditEventId"),
);
export type AuditEventId = typeof AuditEventId.Type;
