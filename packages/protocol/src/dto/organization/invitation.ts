import { Schema } from "effect";

import { EmailAddress } from "#/common/email";
import { InvitationRoleIds, InvitationTeams } from "#/common/invitation";
import { OrganizationName } from "#/common/organization";
import { SecretTokenFromString } from "#/common/secret-token";
import { VerificationCode } from "#/common/verification-code";
import { SessionActor } from "#/dto/auth/session";
import { VerificationId } from "#/identifiers/auth";
import { IdentityConnectionId } from "#/identifiers/identity";
import {
  OrganizationId,
  OrganizationInvitationId,
  OrganizationMemberId,
} from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";

const token = Schema.toEncoded(SecretTokenFromString).annotate({ writeOnly: true });
export const CreateInvitationRequest = Schema.Struct({
  email: Schema.String,
  roleIds: InvitationRoleIds,
  teams: Schema.optionalKey(InvitationTeams),
});
export const InvitationTokenRequest = Schema.Struct({
  invitationId: OrganizationInvitationId,
  token,
});
export const AcceptInvitationRequest = Schema.Union([
  Schema.Struct({
    ...InvitationTokenRequest.fields,
    challengeId: VerificationId,
    displayName: Schema.String,
    method: Schema.Literal("code"),
    code: VerificationCode.annotate({ writeOnly: true }),
  }),
  Schema.Struct({
    ...InvitationTokenRequest.fields,
    challengeId: VerificationId,
    displayName: Schema.String,
    method: Schema.Literal("magic_link"),
    proofToken: token,
  }),
]);
export const PublicInvitation = Schema.Struct({
  id: OrganizationInvitationId,
  email: EmailAddress,
  invitedByMemberId: OrganizationMemberId,
  roleIds: InvitationRoleIds,
  teams: Schema.optionalKey(InvitationTeams),
  expiresAt: Schema.DateTimeUtcFromString,
  acceptedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  acceptedByUserId: Schema.NullOr(UserId),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  createdAt: Schema.DateTimeUtcFromString,
  updatedAt: Schema.DateTimeUtcFromString,
});
export type PublicInvitation = typeof PublicInvitation.Type;
export const ListInvitationsQuery = Schema.Struct({
  cursor: Schema.optionalKey(OrganizationInvitationId),
  limit: Schema.optionalKey(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100 }))),
});
export type ListInvitationsQuery = typeof ListInvitationsQuery.Type;
export const InvitationList = Schema.Struct({
  invitations: Schema.Array(PublicInvitation),
  nextCursor: Schema.NullOr(OrganizationInvitationId),
});
export const InvitationPreview = Schema.Struct({
  methods: Schema.Array(
    Schema.Struct({
      connectionId: IdentityConnectionId,
      provider: Schema.Literals(["google", "oidc", "saml"]),
      name: Schema.String,
    }),
  ),
  ssoRequired: Schema.Boolean,
  organization: Schema.Struct({ id: OrganizationId, name: OrganizationName }),
  expiresAt: Schema.DateTimeUtcFromString,
});
export const InvitationAcceptance = Schema.Struct({
  nextAction: Schema.Literals(["continue", "authenticate_with_sso"]),
  actor: SessionActor,
  organizationId: OrganizationId,
  memberId: OrganizationMemberId,
});
