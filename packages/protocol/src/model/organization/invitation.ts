import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { EmailAddress } from "#/common/email";
import { EmailJobId } from "#/identifiers/email";
import {
  TeamId,
  OrganizationId,
  OrganizationInvitationId,
  OrganizationMemberId,
  OrganizationRoleId,
  InvitationAssignmentId,
} from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";

export const CreateOrganizationInvitation = Schema.Struct({
  id: OrganizationInvitationId,
  organizationId: OrganizationId,
  email: EmailAddress,
  invitedByMemberId: OrganizationMemberId,
  tokenHash: CredentialDigest,
  emailJobId: EmailJobId,
  expiresAt: Schema.DateTimeUtcFromDate,
});
export type CreateOrganizationInvitation = typeof CreateOrganizationInvitation.Type;
export const OrganizationInvitation = Schema.Struct({
  ...CreateOrganizationInvitation.fields,
  acceptedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  acceptedByUserId: Schema.NullOr(UserId),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type OrganizationInvitation = typeof OrganizationInvitation.Type;
export const InvitationAssignment = Schema.Struct({
  id: InvitationAssignmentId,
  organizationId: OrganizationId,
  invitationId: OrganizationInvitationId,
  roleId: OrganizationRoleId,
  scopeKind: Schema.Literals(["organization", "team"]),
  teamId: Schema.NullOr(TeamId),
  createdAt: Schema.DateTimeUtcFromDate,
});
export type InvitationAssignment = typeof InvitationAssignment.Type;
