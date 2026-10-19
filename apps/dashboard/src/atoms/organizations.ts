import type {
  OrganizationMemberId,
  TeamId,
  IdentityConnectionId,
  OrganizationDomainId,
} from "@usepreface/protocol";

import { requestFields } from "#/lib/request-fields";

import { ApiClient, mutation } from "./client";
import { QueryKeys as K } from "./query-keys";

export const organizationAtom = () =>
  ApiClient.query(
    "organizations",
    "get",
    requestFields({ reactivityKeys: [K.authority, K.organization] }),
  );
export const accessAtom = ApiClient.query(
  "currentOrganizationAuthentication",
  "get",
  requestFields({ reactivityKeys: [K.authority, K.organization] }),
);
export const membersAtom = (cursor?: OrganizationMemberId) =>
  ApiClient.query(
    "organizationMembers",
    "list",
    requestFields({
      query: { limit: 100, includeRemoved: true, cursor },
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const teamsAtom = (cursor?: TeamId) =>
  ApiClient.query(
    "teams",
    "list",
    requestFields({
      query: { limit: 100, includeArchived: true, ...(cursor ? { cursor } : {}) },
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const connectionsAtom = () =>
  ApiClient.query(
    "organizationIdentityConnections",
    "list",
    requestFields({
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const domainsAtom = () =>
  ApiClient.query(
    "organizationDomains",
    "list",
    requestFields({
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const policyAtom = () =>
  ApiClient.query(
    "organizations",
    "authPolicy",
    requestFields({
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const methodsAtom = () =>
  ApiClient.query(
    "authenticationPolicy",
    "methods",
    requestFields({
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const readinessAtom = () =>
  ApiClient.query(
    "authenticationPolicy",
    "readiness",
    requestFields({
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const recoveryAtom = () =>
  ApiClient.query(
    "organizationAuthRecovery",
    "get",
    requestFields({
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const connectionAtom = (connectionId: IdentityConnectionId) =>
  ApiClient.query(
    "organizationIdentityConnections",
    "get",
    requestFields({
      params: { connectionId },
      reactivityKeys: [K.authority, K.organization, K.connection(connectionId)],
    }),
  );
export const operatorDomainAtom = (domainId: OrganizationDomainId) =>
  ApiClient.query(
    "organizationDomains",
    "inspectForOperator",
    requestFields({
      params: { domainId },
      reactivityKeys: [K.authority, K.instance],
    }),
  );

export const updateOrganizationMutation = mutation(
  (client) => client.organizations.update,
  () => [K.organization, K.instance],
);
export const leaveOrganizationMutation = mutation(
  (client) => client.organizationMembers.leave,
  () => [K.authority],
);
