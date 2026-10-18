import * as atoms from "#/atoms/identity";

import { toMutation } from "./mutation";

export const useOrganizationIdentityConnectionsCreate = toMutation(
  atoms.organizationIdentityConnectionsCreateMutation,
);
export const useOrganizationIdentityConnectionsCreateSaml = toMutation(
  atoms.organizationIdentityConnectionsCreateSamlMutation,
);
export const useOrganizationIdentityConnectionsUpdate = toMutation(
  atoms.organizationIdentityConnectionsUpdateMutation,
);
export const useOrganizationIdentityConnectionsUpdateSaml = toMutation(
  atoms.organizationIdentityConnectionsUpdateSamlMutation,
);
export const useOrganizationIdentityConnectionsTest = toMutation(
  atoms.organizationIdentityConnectionsTestMutation,
);
export const useOrganizationIdentityConnectionsActivate = toMutation(
  atoms.organizationIdentityConnectionsActivateMutation,
);
export const useOrganizationIdentityConnectionsDisable = toMutation(
  atoms.organizationIdentityConnectionsDisableMutation,
);
export const useOrganizationIdentityConnectionsRefreshMetadata = toMutation(
  atoms.organizationIdentityConnectionsRefreshMetadataMutation,
);
export const useOrganizationIdentityConnectionsRotateSigningKey = toMutation(
  atoms.organizationIdentityConnectionsRotateSigningKeyMutation,
);
export const useOrganizationIdentityConnectionsLink = toMutation(
  atoms.organizationIdentityConnectionsLinkMutation,
);
export const useOrganizationIdentityConnectionsReauthenticate = toMutation(
  atoms.organizationIdentityConnectionsReauthenticateMutation,
);
export const useAuthenticationPolicyUpdate = toMutation(atoms.authenticationPolicyUpdateMutation);
export const useOrganizationAuthRecoveryRotate = toMutation(
  atoms.organizationAuthRecoveryRotateMutation,
);
export const useOrganizationAuthRecoveryRevoke = toMutation(
  atoms.organizationAuthRecoveryRevokeMutation,
);
export const useOrganizationAuthRecoveryRecover = toMutation(
  atoms.organizationAuthRecoveryRecoverMutation,
);
export const useOrganizationDomainsCreate = toMutation(atoms.organizationDomainsCreateMutation);
export const useOrganizationDomainsRequest = toMutation(atoms.organizationDomainsRequestMutation);
export const useOrganizationDomainsVerify = toMutation(atoms.organizationDomainsVerifyMutation);
export const useOrganizationDomainsRevoke = toMutation(atoms.organizationDomainsRevokeMutation);
export const useOrganizationDomainsApprove = toMutation(atoms.organizationDomainsApproveMutation);
export const useOrganizationDomainsWithdrawApproval = toMutation(
  atoms.organizationDomainsWithdrawApprovalMutation,
);
export const useOrganizationDomainsBind = toMutation(atoms.organizationDomainsBindMutation);
export const useConnectionOperationsPrepare = toMutation(atoms.connectionOperationsPrepareMutation);
export const useConnectionOperationsTest = toMutation(atoms.connectionOperationsTestMutation);
export const useConnectionOperationsActivate = toMutation(
  atoms.connectionOperationsActivateMutation,
);
export const useConnectionOperationsRetire = toMutation(atoms.connectionOperationsRetireMutation);
export const useIdentityConnectionsSaveGoogle = toMutation(
  atoms.identityConnectionsSaveGoogleMutation,
);
export const useIdentityConnectionsTestGoogle = toMutation(
  atoms.identityConnectionsTestGoogleMutation,
);
export const useIdentityConnectionsActivateGoogle = toMutation(
  atoms.identityConnectionsActivateGoogleMutation,
);
export const useIdentityConnectionsDisableGoogle = toMutation(
  atoms.identityConnectionsDisableGoogleMutation,
);
