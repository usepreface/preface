import { createBrandedId } from "#/common/branded-id";

export const AuditEventId = createBrandedId("AuditEventId");
export type AuditEventId = typeof AuditEventId.Type;
