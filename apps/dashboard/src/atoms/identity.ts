import { mutation } from "./client";
import { QueryKeys as K } from "./query-keys";

export const organizationIdentityConnectionsCreateMutation = mutation(
  (client) => client.organizationIdentityConnections.create,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsCreateSamlMutation = mutation(
  (client) => client.organizationIdentityConnections.createSaml,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsUpdateMutation = mutation(
  (client) => client.organizationIdentityConnections.update,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsUpdateSamlMutation = mutation(
  (client) => client.organizationIdentityConnections.updateSaml,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsTestMutation = mutation(
  (client) => client.organizationIdentityConnections.test,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsActivateMutation = mutation(
  (client) => client.organizationIdentityConnections.activate,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsDisableMutation = mutation(
  (client) => client.organizationIdentityConnections.disable,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsRefreshMetadataMutation = mutation(
  (client) => client.organizationIdentityConnections.refreshMetadata,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsRotateSigningKeyMutation = mutation(
  (client) => client.organizationIdentityConnections.rotateSigningKey,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsLinkMutation = mutation(
  (client) => client.organizationIdentityConnections.link,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationIdentityConnectionsReauthenticateMutation = mutation(
  (client) => client.organizationIdentityConnections.reauthenticate,
  (request) => [K.organization(request.params.organizationId)],
);
export const authenticationPolicyUpdateMutation = mutation(
  (client) => client.authenticationPolicy.update,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationAuthRecoveryRotateMutation = mutation(
  (client) => client.organizationAuthRecovery.rotate,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationAuthRecoveryRevokeMutation = mutation(
  (client) => client.organizationAuthRecovery.revoke,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationAuthRecoveryRecoverMutation = mutation(
  (client) => client.organizationAuthRecovery.recover,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationDomainsCreateMutation = mutation(
  (client) => client.organizationDomains.create,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationDomainsRequestMutation = mutation(
  (client) => client.organizationDomains.request,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationDomainsVerifyMutation = mutation(
  (client) => client.organizationDomains.verify,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationDomainsRevokeMutation = mutation(
  (client) => client.organizationDomains.revoke,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationDomainsApproveMutation = mutation(
  (client) => client.organizationDomains.approve,
  () => [K.instance, K.authority, K.account],
);
export const organizationDomainsWithdrawApprovalMutation = mutation(
  (client) => client.organizationDomains.withdrawApproval,
  () => [K.instance, K.authority, K.account],
);
export const organizationDomainsBindMutation = mutation(
  (client) => client.organizationDomains.bind,
  (request) => [K.organization(request.params.organizationId)],
);
export const connectionOperationsPrepareMutation = mutation(
  (client) => client.connectionOperations.prepare,
  (request) => [K.organization(request.params.organizationId)],
);
export const connectionOperationsTestMutation = mutation(
  (client) => client.connectionOperations.test,
  (request) => [K.organization(request.params.organizationId)],
);
export const connectionOperationsActivateMutation = mutation(
  (client) => client.connectionOperations.activate,
  (request) => [K.organization(request.params.organizationId)],
);
export const connectionOperationsRetireMutation = mutation(
  (client) => client.connectionOperations.retire,
  (request) => [K.organization(request.params.organizationId)],
);
export const identityConnectionsSaveGoogleMutation = mutation(
  (client) => client.identityConnections.saveGoogle,
  () => [K.instance, K.authority, K.account],
);
export const identityConnectionsTestGoogleMutation = mutation(
  (client) => client.identityConnections.testGoogle,
  () => [K.instance, K.authority, K.account],
);
export const identityConnectionsActivateGoogleMutation = mutation(
  (client) => client.identityConnections.activateGoogle,
  () => [K.instance, K.authority, K.account],
);
export const identityConnectionsDisableGoogleMutation = mutation(
  (client) => client.identityConnections.disableGoogle,
  () => [K.instance, K.authority, K.account],
);
