export { UserEmailId, VerificationId, SessionAuthenticationId } from "#/identifiers/auth";
export { InstallationId, InstanceOwnerId } from "#/identifiers/instance";
export { UserId } from "#/identifiers/user";
export { SessionId } from "#/identifiers/session";
export { AuditEventId } from "#/identifiers/audit";
export { EmailJobId } from "#/identifiers/email";
export { BootstrapChallengeId } from "#/identifiers/bootstrap";
export {
  BootstrapError,
  InstanceStateError,
  AuthenticationError,
  RequestError,
  RequestErrorCode,
} from "#/errors/index";

// Preserve existing root imports while consumers move to the explicit contract entry points.
export {
  PublicUser,
  PublicSession,
  SessionActor,
  BootstrapStatus,
  BootstrapTokenInfo,
  CompleteBootstrapRequest,
  RequestBootstrapVerificationRequest,
  ResendBootstrapVerificationRequest,
  BootstrapVerification,
  InspectBootstrapRequest,
} from "#/dto/index";
export {
  CompleteBootstrapInput,
  RequestBootstrapVerificationInput,
  ResendBootstrapVerificationInput,
} from "#/input/index";

export { EmailSignInError } from "#/errors/auth/email-sign-in";

export {
  OrganizationId,
  OrganizationMemberId,
  OrganizationRoleId,
  OrganizationRoleBindingId,
} from "#/identifiers/organization";
export { OrganizationError } from "#/errors/organization/organization";

export {
  createBrandedId,
  DisplayName,
  DisplayNameInput,
  DisplayName as UserDisplayName,
  DisplayName as InstanceDisplayName,
  EmailAddress,
  EmailAddressInput,
  EmailAddress as UserEmail,
  CredentialDigest,
  SecretToken,
  SecretTokenFromString,
  VerificationCode,
  VerificationCodeFromString,
  OrganizationName,
  OrganizationSlug,
  OrganizationRoleKey,
  OrganizationRoleKind,
  OrganizationPermission,
  OrganizationPermissions,
  OrganizationLoginMethod,
} from "#/common/index";

export { OrganizationInvitationId, InvitationAssignmentId } from "#/identifiers/organization";
export { InvitationError } from "#/errors/organization/invitation";

export {
  UserMetadataV1,
  UserMetadata,
  OrganizationMetadataV1,
  OrganizationMetadata,
  TeamMetadataV1,
  TeamMetadata,
} from "#/metadata/index";

export { TeamId, TeamMemberId } from "#/identifiers/organization";
export { TeamPermission, RolePermission, RolePermissions, RoleScope } from "#/common/organization";
export { TeamError } from "#/errors/organization/team";

export { ProfileError } from "#/errors/auth/profile";

export { MetadataImage } from "#/common/metadata-image";

export { IdentityConnectionId, AccountId, AuthFlowId } from "#/identifiers/identity";
export { IdentityError } from "#/errors/auth/identity";
export {
  ConnectionStatus,
  AuthFlowIntent,
  GoogleConfiguration,
  IdentityRevision,
  AuthenticationReturnPath,
  GoogleSubject,
} from "#/common/identity";

export { OrganizationAuthRecoveryTokenId } from "#/identifiers/organization";

export { SsoReadinessBlocker } from "#/common/organization-authentication";
