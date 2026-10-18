export {
  CompleteBootstrapInput,
  RequestBootstrapVerificationInput,
  ResendBootstrapVerificationInput,
} from "#/input/instance/bootstrap";

export {
  RequestEmailSignInInput,
  ResendEmailSignInInput,
  VerifyEmailSignInInput,
} from "#/input/auth/email-sign-in";

export {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  CreateOrganizationRoleInput,
  UpdateOrganizationRoleInput,
} from "#/input/organization/organization";

export {
  CreateInvitationInput,
  InvitationTokenInput,
  AcceptInvitationInput,
} from "#/input/organization/invitation";

export {
  CreateOrganizationInput as CreateTeamInput,
  UpdateOrganizationInput as UpdateTeamInput,
} from "#/input/organization/organization";

export { UpdateProfileInput } from "#/input/auth/profile";

export {
  SaveGoogleConnectionInput,
  GoogleStartInput,
  UpdateGooglePolicyInput,
} from "#/input/auth/identity";

export { GoogleCallbackInput } from "#/input/auth/identity";

export { CreateOidcConnectionInput, UpdateOidcConnectionInput } from "#/input/auth/oidc";

export {
  GoogleStartInput as ExternalIdentityStartInput,
  GoogleCallbackInput as ExternalIdentityCallbackInput,
} from "#/input/auth/identity";

export {
  UpdateOrganizationAuthPolicyInput,
  RecoverOrganizationAuthInput,
} from "#/input/organization/authentication";

export {
  CreateSamlConnectionInput,
  UpdateSamlConnectionInput,
  SamlCallbackInput,
  CompleteSamlFlowInput,
} from "#/input/auth/saml";

export * from "#/input/organization/domain";

export * from "#/input/auth/external";

export * from "#/input/auth/discovery";
