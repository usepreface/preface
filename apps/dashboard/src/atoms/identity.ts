import { mutation } from "./client";
import { QueryKeys as K } from "./query-keys";

export const organizationIdentityConnectionsCreateMutation = mutation(
  (client) => client.organizationIdentityConnections.create,
  () => [K.organization],
);
export const organizationIdentityConnectionsCreateSamlMutation = mutation(
  (client) => client.organizationIdentityConnections.createSaml,
  () => [K.organization],
);
export const organizationIdentityConnectionsUpdateMutation = mutation(
  (client) => client.organizationIdentityConnections.update,
  () => [K.organization],
);
export const organizationIdentityConnectionsUpdateSamlMutation = mutation(
  (client) => client.organizationIdentityConnections.updateSaml,
  () => [K.organization],
);
export const organizationIdentityConnectionsTestMutation = mutation(
  (client) => client.organizationIdentityConnections.test,
  () => [K.organization],
);
export const organizationIdentityConnectionsActivateMutation = mutation(
  (client) => client.organizationIdentityConnections.activate,
  () => [K.organization],
);
export const organizationIdentityConnectionsDisableMutation = mutation(
  (client) => client.organizationIdentityConnections.disable,
  () => [K.organization],
);
export const organizationIdentityConnectionsRefreshMetadataMutation = mutation(
  (client) => client.organizationIdentityConnections.refreshMetadata,
  () => [K.organization],
);
export const organizationIdentityConnectionsRotateSigningKeyMutation = mutation(
  (client) => client.organizationIdentityConnections.rotateSigningKey,
  () => [K.organization],
);
export const organizationIdentityConnectionsLinkMutation = mutation(
  (client) => client.organizationIdentityConnections.link,
  () => [K.organization],
);
export const organizationIdentityConnectionsReauthenticateMutation = mutation(
  (client) => client.organizationIdentityConnections.reauthenticate,
  () => [K.organization],
);
export const authenticationPolicyUpdateMutation = mutation(
  (client) => client.authenticationPolicy.update,
  () => [K.organization],
);
export const organizationAuthRecoveryRotateMutation = mutation(
  (client) => client.organizationAuthRecovery.rotate,
  () => [K.organization],
);
export const organizationAuthRecoveryRevokeMutation = mutation(
  (client) => client.organizationAuthRecovery.revoke,
  () => [K.organization],
);
export const organizationAuthRecoveryRecoverMutation = mutation(
  (client) => client.organizationAuthRecovery.recover,
  () => [K.organization],
);
export const organizationDomainsCreateMutation = mutation(
  (client) => client.organizationDomains.create,
  () => [K.organization],
);
export const organizationDomainsRequestMutation = mutation(
  (client) => client.organizationDomains.request,
  () => [K.organization],
);
export const organizationDomainsVerifyMutation = mutation(
  (client) => client.organizationDomains.verify,
  () => [K.organization],
);
export const organizationDomainsRevokeMutation = mutation(
  (client) => client.organizationDomains.revoke,
  () => [K.organization],
);
export const organizationDomainsApproveMutation = mutation(
  (client) => client.organizationDomains.approve,
  () => [K.instance, K.organization, K.authority, K.account],
);
export const organizationDomainsWithdrawApprovalMutation = mutation(
  (client) => client.organizationDomains.withdrawApproval,
  () => [K.instance, K.organization, K.authority, K.account],
);
export const organizationDomainsBindMutation = mutation(
  (client) => client.organizationDomains.bind,
  () => [K.organization],
);
export const connectionOperationsPrepareMutation = mutation(
  (client) => client.connectionOperations.prepare,
  () => [K.organization],
);
export const connectionOperationsTestMutation = mutation(
  (client) => client.connectionOperations.test,
  () => [K.organization],
);
export const connectionOperationsActivateMutation = mutation(
  (client) => client.connectionOperations.activate,
  () => [K.organization],
);
export const connectionOperationsRetireMutation = mutation(
  (client) => client.connectionOperations.retire,
  () => [K.organization],
);
export const identityConnectionsSaveGoogleMutation = mutation(
  (client) => client.identityConnections.saveGoogle,
  () => [K.instance, K.organization, K.authority, K.account],
);
export const identityConnectionsTestGoogleMutation = mutation(
  (client) => client.identityConnections.testGoogle,
  () => [K.instance, K.organization, K.authority, K.account],
);
export const identityConnectionsActivateGoogleMutation = mutation(
  (client) => client.identityConnections.activateGoogle,
  () => [K.instance, K.organization, K.authority, K.account],
);
export const identityConnectionsDisableGoogleMutation = mutation(
  (client) => client.identityConnections.disableGoogle,
  () => [K.instance, K.organization, K.authority, K.account],
);
