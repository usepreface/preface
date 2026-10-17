import { Schema } from "effect";

import { AuditEventId } from "#/identifiers/audit";
import { InstallationId, InstanceOwnerId } from "#/identifiers/instance";
import { SessionId } from "#/identifiers/session";
import { UserId } from "#/identifiers/user";
import { InstanceOwnerGrantSource } from "#/model/instance/owner";

export const AuditActorKind = Schema.Literals(["user", "system"]);
export type AuditActorKind = typeof AuditActorKind.Type;

const actorFields = {
  actorKind: AuditActorKind,
  actorUserId: Schema.NullOr(UserId),
};
const actorCheck = Schema.makeFilter<{
  readonly actorKind: typeof AuditActorKind.Type;
  readonly actorUserId: UserId | null;
}>(
  (event) =>
    (event.actorKind === "user" ? event.actorUserId !== null : event.actorUserId === null) ||
    "Only user actors have an acting user",
);

const emptyMetadata = Schema.Record(Schema.String, Schema.Never);
const bootstrapFields = {
  ...actorFields,
  eventType: Schema.Literal("instance.bootstrap_completed"),
  targetType: Schema.Literal("installation"),
  targetId: InstallationId,
  metadata: emptyMetadata,
};
const ownerFields = {
  ...actorFields,
  eventType: Schema.Literal("instance.owner_granted"),
  targetType: Schema.Literal("instance_owner"),
  targetId: InstanceOwnerId,
  metadata: Schema.Struct({ grantSource: InstanceOwnerGrantSource }),
};
const bootstrapTokenFields = {
  ...actorFields,
  eventType: Schema.Literal("instance.bootstrap_token_issued"),
  targetType: Schema.Literal("installation"),
  targetId: InstallationId,
  metadata: Schema.Struct({ replacesExisting: Schema.Boolean }),
};
const sessionFields = {
  ...actorFields,
  eventType: Schema.Literals(["auth.session_created", "auth.session_revoked"]),
  targetType: Schema.Literal("session"),
  targetId: SessionId,
  metadata: emptyMetadata,
};

export const RecordAuditEvent = Schema.Union([
  Schema.Struct(bootstrapFields),
  Schema.Struct(bootstrapTokenFields),
  Schema.Struct(ownerFields),
  Schema.Struct(sessionFields),
]).check(actorCheck);
export type RecordAuditEvent = typeof RecordAuditEvent.Type;

const storedFields = { id: AuditEventId, occurredAt: Schema.DateTimeUtcFromDate };
export const AuditEvent = Schema.Union([
  Schema.Struct({ ...bootstrapFields, ...storedFields }),
  Schema.Struct({ ...bootstrapTokenFields, ...storedFields }),
  Schema.Struct({ ...ownerFields, ...storedFields }),
  Schema.Struct({ ...sessionFields, ...storedFields }),
]).check(actorCheck);
export type AuditEvent = typeof AuditEvent.Type;
