import { Effect } from "effect";
import { Atom } from "effect/reactivity";

import type {
  OrganizationId,
  OrganizationMemberId,
  TeamId,
  IdentityConnectionId,
  OrganizationDomainId,
} from "@usepreface/protocol";

import { requestFields } from "#/lib/request-fields";

import { ApiClient, mutation } from "./client";
import { QueryKeys as K } from "./query-keys";

export const organizationsAtom = (cursor?: OrganizationId) =>
  ApiClient.query(
    "organizations",
    "list",
    requestFields({
      query: { limit: 100, includeArchived: true, ...(cursor ? { cursor } : {}) },
      reactivityKeys: [K.authority, K.organizations],
    }),
  );
// Resolve a route slug against the actor's own paginated directory. No instance-owner bypass.
export const organizationBySlugAtom = Atom.family((slug: string) =>
  ApiClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        let cursor: OrganizationId | undefined;
        const seen = new Set<string>();
        do {
          const page = yield* client.organizations.list({
            query: { limit: 100, includeArchived: true, ...(cursor ? { cursor } : {}) },
          });
          const organization = page.organizations.find((candidate) => candidate.slug === slug);
          if (organization) return organization;
          if (page.nextCursor === null) return null;
          if (seen.has(page.nextCursor))
            return yield* Effect.die(new Error("Repeated organization cursor"));
          seen.add(page.nextCursor);
          cursor = page.nextCursor;
        } while (true);
      }),
    )
    .pipe(ApiClient.runtime.factory.withReactivity([K.authority, K.organizations])),
);

export const organizationAtom = (organizationId: OrganizationId) =>
  ApiClient.query(
    "organizations",
    "get",
    requestFields({
      params: { organizationId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const selectionAtom = Atom.family((organizationId: OrganizationId) =>
  ApiClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.organizationSelection.select({
          params: { organizationId },
          payload: {},
        });
      }),
    )
    .pipe(ApiClient.runtime.factory.withReactivity([K.authority, K.organization(organizationId)])),
);
export const membersAtom = (organizationId: OrganizationId, cursor?: OrganizationMemberId) =>
  ApiClient.query(
    "organizationMembers",
    "list",
    requestFields({
      params: { organizationId },
      query: { limit: 100, includeRemoved: true, cursor },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const teamsAtom = (organizationId: OrganizationId, cursor?: TeamId) =>
  ApiClient.query(
    "teams",
    "list",
    requestFields({
      params: { organizationId },
      query: { limit: 100, includeArchived: true, ...(cursor ? { cursor } : {}) },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const connectionsAtom = (organizationId: OrganizationId) =>
  ApiClient.query(
    "organizationIdentityConnections",
    "list",
    requestFields({
      params: { organizationId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const domainsAtom = (organizationId: OrganizationId) =>
  ApiClient.query(
    "organizationDomains",
    "list",
    requestFields({
      params: { organizationId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const policyAtom = (organizationId: OrganizationId) =>
  ApiClient.query(
    "organizations",
    "authPolicy",
    requestFields({
      params: { organizationId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const methodsAtom = (organizationId: OrganizationId) =>
  ApiClient.query(
    "authenticationPolicy",
    "methods",
    requestFields({
      params: { organizationId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const readinessAtom = (organizationId: OrganizationId) =>
  ApiClient.query(
    "authenticationPolicy",
    "readiness",
    requestFields({
      params: { organizationId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const recoveryAtom = (organizationId: OrganizationId) =>
  ApiClient.query(
    "organizationAuthRecovery",
    "get",
    requestFields({
      params: { organizationId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const connectionAtom = (
  organizationId: OrganizationId,
  connectionId: IdentityConnectionId,
) =>
  ApiClient.query(
    "organizationIdentityConnections",
    "get",
    requestFields({
      params: { organizationId, connectionId },
      reactivityKeys: [K.authority, K.organization(organizationId), K.connection(connectionId)],
    }),
  );
export const operatorDomainAtom = (
  organizationId: OrganizationId,
  domainId: OrganizationDomainId,
) =>
  ApiClient.query(
    "organizationDomains",
    "inspectForOperator",
    requestFields({
      params: { organizationId, domainId },
      reactivityKeys: [K.authority, K.instance],
    }),
  );

export const createOrganizationMutation = mutation(
  (client) => client.organizations.create,
  () => [K.organizations],
);
export const updateOrganizationMutation = mutation(
  (client) => client.organizations.update,
  (request) => [K.organizations, K.organization(request.params.organizationId)],
);
export const archiveOrganizationMutation = mutation(
  (client) => client.organizations.archive,
  (request) => [K.organizations, K.organization(request.params.organizationId)],
);
export const restoreOrganizationMutation = mutation(
  (client) => client.organizations.restore,
  (request) => [K.organizations, K.organization(request.params.organizationId)],
);
export const leaveOrganizationMutation = mutation(
  (client) => client.organizationMembers.leave,
  () => [K.organizations, K.authority],
);
