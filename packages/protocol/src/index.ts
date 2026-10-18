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
  EmailSignInError,
  OrganizationError,
  InvitationError,
  TeamError,
  ProfileError,
  IdentityError,
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

export {
  OrganizationId,
  OrganizationMemberId,
  OrganizationRoleId,
  OrganizationRoleBindingId,
  OrganizationInvitationId,
  InvitationAssignmentId,
  OrganizationAuthRecoveryTokenId,
  TeamId,
  TeamMemberId,
} from "#/identifiers/organization";

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

export {
  UserMetadataV1,
  UserMetadata,
  OrganizationMetadataV1,
  OrganizationMetadata,
  TeamMetadataV1,
  TeamMetadata,
} from "#/metadata/index";

export { TeamPermission, RolePermission, RolePermissions, RoleScope } from "#/common/organization";

export { MetadataImage } from "#/common/metadata-image";

export {
  IdentityConnectionKeyId,
  IdentityConnectionId,
  AccountId,
  AuthFlowId,
  OrganizationDomainId,
} from "#/identifiers/identity";
export {
  ConnectionStatus,
  AuthFlowIntent,
  GoogleConfiguration,
  IdentityRevision,
  AuthenticationReturnPath,
  GoogleSubject,
} from "#/common/identity";

export { SsoReadinessBlocker } from "#/common/organization-authentication";

export { DomainName, DomainNameInput } from "#/common/domain";

export { AuditCursor } from "#/common/audit";
