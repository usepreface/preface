import { Schema } from "effect";

import {
  OrganizationName,
  OrganizationSlug,
  OrganizationRoleKey,
  RolePermissions,
} from "#/common/organization";
import { AuditEventId } from "#/identifiers/audit";
import { VerificationId, UserEmailId } from "#/identifiers/auth";
import { BootstrapChallengeId } from "#/identifiers/bootstrap";
import { InstallationId, InstanceOwnerId } from "#/identifiers/instance";
import {
  TeamId,
  TeamMemberId,
  OrganizationInvitationId,
  OrganizationId,
  OrganizationMemberId,
  OrganizationRoleId,
  OrganizationRoleBindingId,
} from "#/identifiers/organization";
import { SessionId } from "#/identifiers/session";
import { UserId } from "#/identifiers/user";
import { EmailAuthenticationMethod } from "#/model/auth/session-authentication";
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

const bootstrapVerificationFields = {
  ...actorFields,
  eventType: Schema.Literals([
    "instance.bootstrap_verification_requested",
    "instance.bootstrap_verification_failed",
  ]),
  targetType: Schema.Literal("installation"),
  targetId: InstallationId,
  metadata: Schema.Struct({ challengeId: BootstrapChallengeId, attempts: Schema.Natural }),
};
const emailVerifiedFields = {
  ...actorFields,
  eventType: Schema.Literal("auth.email_verified"),
  targetType: Schema.Literal("user"),
  targetId: UserId,
  metadata: emptyMetadata,
};

const signInFields = {
  ...actorFields,
  eventType: Schema.Literals(["auth.email_sign_in_requested", "auth.email_sign_in_failed"]),
  targetType: Schema.Literal("verification"),
  targetId: VerificationId,
  metadata: Schema.Struct({ attempts: Schema.Natural }),
};
const authenticatedFields = {
  ...actorFields,
  eventType: Schema.Literal("auth.session_authenticated"),
  targetType: Schema.Literal("session"),
  targetId: SessionId,
  metadata: Schema.Struct({ method: EmailAuthenticationMethod, userEmailId: UserEmailId }),
};

const organizationActor = {
  actorKind: Schema.Literal("user"),
  actorUserId: UserId,
  organizationId: OrganizationId,
};
const organizationFields = {
  ...organizationActor,
  eventType: Schema.Literals([
    "organization.created",
    "organization.updated",
    "organization.archived",
    "organization.restored",
  ]),
  targetType: Schema.Literal("organization"),
  targetId: OrganizationId,
  metadata: Schema.Struct({ name: OrganizationName, slug: OrganizationSlug }),
};
const organizationMemberFields = {
  ...organizationActor,
  eventType: Schema.Literals([
    "organization.member_suspended",
    "organization.member_reinstated",
    "organization.member_removed",
    "organization.member_left",
    "organization.owner_granted",
    "organization.owner_revoked",
  ]),
  targetType: Schema.Literal("organization_member"),
  targetId: OrganizationMemberId,
  metadata: emptyMetadata,
};
const organizationRoleFields = {
  ...organizationActor,
  eventType: Schema.Literals([
    "organization.role_created",
    "organization.role_updated",
    "organization.role_archived",
  ]),
  targetType: Schema.Literal("organization_role"),
  targetId: OrganizationRoleId,
  metadata: Schema.Struct({ key: OrganizationRoleKey, permissions: RolePermissions }),
};
const organizationBindingFields = {
  ...organizationActor,
  eventType: Schema.Literals(["organization.role_granted", "organization.role_revoked"]),
  targetType: Schema.Literal("organization_role_binding"),
  targetId: OrganizationRoleBindingId,
  metadata: Schema.Struct({
    roleId: OrganizationRoleId,
    memberId: OrganizationMemberId,
    teamId: Schema.optionalKey(Schema.NullOr(TeamId)),
  }),
};
const ownershipTransferFields = {
  ...organizationActor,
  eventType: Schema.Literal("organization.ownership_transferred"),
  targetType: Schema.Literal("organization"),
  targetId: OrganizationId,
  metadata: Schema.Struct({ fromMemberId: OrganizationMemberId, toMemberId: OrganizationMemberId }),
};

const invitationFields = {
  ...organizationActor,
  eventType: Schema.Literals([
    "organization.invitation_created",
    "organization.invitation_resent",
    "organization.invitation_revoked",
    "organization.invitation_accepted",
  ]),
  targetType: Schema.Literal("organization_invitation"),
  targetId: OrganizationInvitationId,
  metadata: Schema.Struct({
    roleIds: Schema.Array(OrganizationRoleId),
    teamIds: Schema.optionalKey(Schema.Array(TeamId)),
  }),
};

const invitationVerificationFields = {
  actorKind: Schema.Literal("system"),
  actorUserId: Schema.Null,
  organizationId: OrganizationId,
  eventType: Schema.Literals([
    "organization.invitation_verification_requested",
    "organization.invitation_verification_failed",
  ]),
  targetType: Schema.Literal("organization_invitation"),
  targetId: OrganizationInvitationId,
  metadata: Schema.Struct({ challengeId: VerificationId, attempts: Schema.Natural }),
};

const teamFields = {
  ...organizationActor,
  eventType: Schema.Literals(["team.created", "team.updated", "team.archived"]),
  targetType: Schema.Literal("team"),
  targetId: TeamId,
  metadata: Schema.Struct({ name: OrganizationName, slug: OrganizationSlug }),
};
const teamMemberFields = {
  ...organizationActor,
  eventType: Schema.Literals(["team.member_added", "team.member_removed"]),
  targetType: Schema.Literal("team_member"),
  targetId: TeamMemberId,
  metadata: Schema.Struct({ teamId: TeamId, memberId: OrganizationMemberId }),
};
const profileFields = {
  actorKind: Schema.Literal("user"),
  actorUserId: UserId,
  eventType: Schema.Literal("auth.profile_updated"),
  targetType: Schema.Literal("user"),
  targetId: UserId,
  metadata: Schema.Struct({
    changedFields: Schema.Array(Schema.Literals(["name", "title", "bio"])),
  }),
};
export const RecordAuditEvent = Schema.Union([
  Schema.Struct(profileFields),
  Schema.Struct(teamFields),
  Schema.Struct(teamMemberFields),
  Schema.Struct(invitationFields),
  Schema.Struct(invitationVerificationFields),
  Schema.Struct(organizationFields),
  Schema.Struct(organizationMemberFields),
  Schema.Struct(organizationRoleFields),
  Schema.Struct(organizationBindingFields),
  Schema.Struct(ownershipTransferFields),
  Schema.Struct(signInFields),
  Schema.Struct(authenticatedFields),
  Schema.Struct(bootstrapFields),
  Schema.Struct(bootstrapVerificationFields),
  Schema.Struct(emailVerifiedFields),
  Schema.Struct(bootstrapTokenFields),
  Schema.Struct(ownerFields),
  Schema.Struct(sessionFields),
]).check(actorCheck);
export type RecordAuditEvent = typeof RecordAuditEvent.Type;

const storedFields = {
  id: AuditEventId,
  occurredAt: Schema.DateTimeUtcFromDate,
  organizationId: Schema.Null,
};
const organizationStoredFields = { id: AuditEventId, occurredAt: Schema.DateTimeUtcFromDate };
export const AuditEvent = Schema.Union([
  Schema.Struct({ ...profileFields, ...storedFields }),
  Schema.Struct({ ...teamFields, ...organizationStoredFields }),
  Schema.Struct({ ...teamMemberFields, ...organizationStoredFields }),
  Schema.Struct({ ...invitationFields, ...organizationStoredFields }),
  Schema.Struct({ ...invitationVerificationFields, ...organizationStoredFields }),
  Schema.Struct({ ...organizationFields, ...organizationStoredFields }),
  Schema.Struct({ ...organizationMemberFields, ...organizationStoredFields }),
  Schema.Struct({ ...organizationRoleFields, ...organizationStoredFields }),
  Schema.Struct({ ...organizationBindingFields, ...organizationStoredFields }),
  Schema.Struct({ ...ownershipTransferFields, ...organizationStoredFields }),
  Schema.Struct({ ...signInFields, ...storedFields }),
  Schema.Struct({ ...authenticatedFields, ...storedFields }),
  Schema.Struct({ ...bootstrapFields, ...storedFields }),
  Schema.Struct({ ...bootstrapVerificationFields, ...storedFields }),
  Schema.Struct({ ...emailVerifiedFields, ...storedFields }),
  Schema.Struct({ ...bootstrapTokenFields, ...storedFields }),
  Schema.Struct({ ...ownerFields, ...storedFields }),
  Schema.Struct({ ...sessionFields, ...storedFields }),
]).check(actorCheck);
export type AuditEvent = typeof AuditEvent.Type;
