import { Effect } from "effect";
import { Atom } from "effect/reactivity";

import type {
  OrganizationId,
  OrganizationMemberId,
  OrganizationInvitationId,
  OrganizationRoleId,
  RoleScope,
  TeamId,
  TeamMemberId,
} from "@usepreface/protocol";

import { requestFields } from "#/lib/request-fields";

import { ApiClient, mutation } from "./client";
import { collectPages } from "./pagination";
import { QueryKeys as K } from "./query-keys";

export const organizationMembersSuspendMutation = mutation(
  (client) => client.organizationMembers.suspend,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationMembersReinstateMutation = mutation(
  (client) => client.organizationMembers.reinstate,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationMembersRemoveMutation = mutation(
  (client) => client.organizationMembers.remove,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationInvitationsCreateMutation = mutation(
  (client) => client.organizationInvitations.create,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationInvitationsResendMutation = mutation(
  (client) => client.organizationInvitations.resend,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationInvitationsRevokeMutation = mutation(
  (client) => client.organizationInvitations.revoke,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationRolesCreateMutation = mutation(
  (client) => client.organizationRoles.create,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationRolesUpdateMutation = mutation(
  (client) => client.organizationRoles.update,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationRolesArchiveMutation = mutation(
  (client) => client.organizationRoles.archive,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationRoleBindingsGrantMutation = mutation(
  (client) => client.organizationRoleBindings.grant,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationRoleBindingsRevokeMutation = mutation(
  (client) => client.organizationRoleBindings.revoke,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationOwnershipGrantMutation = mutation(
  (client) => client.organizationOwnership.grant,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationOwnershipRevokeMutation = mutation(
  (client) => client.organizationOwnership.revoke,
  (request) => [K.organization(request.params.organizationId)],
);
export const organizationOwnershipTransferMutation = mutation(
  (client) => client.organizationOwnership.transfer,
  (request) => [K.organization(request.params.organizationId)],
);
export const teamsCreateMutation = mutation(
  (client) => client.teams.create,
  (request) => [K.organization(request.params.organizationId)],
);
export const teamsUpdateMutation = mutation(
  (client) => client.teams.update,
  (request) => [K.organization(request.params.organizationId)],
);
export const teamsArchiveMutation = mutation(
  (client) => client.teams.archive,
  (request) => [K.organization(request.params.organizationId)],
);
export const teamsAddMemberMutation = mutation(
  (client) => client.teams.addMember,
  (request) => [K.organization(request.params.organizationId)],
);
export const teamsRemoveMemberMutation = mutation(
  (client) => client.teams.removeMember,
  (request) => [K.organization(request.params.organizationId)],
);

export const rolesAtom = (
  organizationId: OrganizationId,
  cursor?: OrganizationRoleId,
  scopeKind: RoleScope = "organization",
) =>
  ApiClient.query(
    "organizationRoles",
    "list",
    requestFields({
      params: { organizationId },
      query: { limit: 100, includeArchived: true, scopeKind, ...(cursor ? { cursor } : {}) },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const invitationsAtom = (
  organizationId: OrganizationId,
  cursor?: OrganizationInvitationId,
) =>
  ApiClient.query(
    "organizationInvitations",
    "list",
    requestFields({
      params: { organizationId },
      query: { limit: 100, ...(cursor ? { cursor } : {}) },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const bindingsAtom = (
  organizationId: OrganizationId,
  memberId: OrganizationMemberId,
  teamId?: TeamId,
) =>
  ApiClient.query(
    "organizationRoleBindings",
    "list",
    requestFields({
      params: { organizationId },
      query: { memberId, teamId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const teamAtom = (organizationId: OrganizationId, teamId: TeamId) =>
  ApiClient.query(
    "teams",
    "get",
    requestFields({
      params: { organizationId, teamId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const teamAccessAtom = (organizationId: OrganizationId, teamId: TeamId) =>
  ApiClient.query(
    "teams",
    "access",
    requestFields({
      params: { organizationId, teamId },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const teamMembersAtom = (
  organizationId: OrganizationId,
  teamId: TeamId,
  cursor?: TeamMemberId,
) =>
  ApiClient.query(
    "teams",
    "members",
    requestFields({
      params: { organizationId, teamId },
      query: { cursor, limit: 100 },
      reactivityKeys: [K.authority, K.organization(organizationId)],
    }),
  );
export const allRolesAtom = Atom.family((organizationId: OrganizationId) =>
  ApiClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const scopes = yield* Effect.forEach(
          ["organization", "team"] as const,
          (scopeKind) =>
            collectPages((cursor?: OrganizationRoleId) =>
              client.organizationRoles
                .list({
                  params: { organizationId },
                  query: { limit: 100, scopeKind, ...(cursor ? { cursor } : {}) },
                })
                .pipe(Effect.map((page) => ({ values: page.roles, nextCursor: page.nextCursor }))),
            ),
          { concurrency: 2 },
        );
        return scopes.flat();
      }),
    )
    .pipe(ApiClient.runtime.factory.withReactivity([K.authority, K.organization(organizationId)])),
);
export const allMembersAtom = Atom.family((organizationId: OrganizationId) =>
  ApiClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* collectPages((cursor?: OrganizationMemberId) =>
          client.organizationMembers
            .list({
              params: { organizationId },
              query: { limit: 100, ...(cursor ? { cursor } : {}) },
            })
            .pipe(Effect.map((page) => ({ values: page.members, nextCursor: page.nextCursor }))),
        );
      }),
    )
    .pipe(ApiClient.runtime.factory.withReactivity([K.authority, K.organization(organizationId)])),
);
export const allTeamsAtom = Atom.family((organizationId: OrganizationId) =>
  ApiClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* collectPages((cursor?: TeamId) =>
          client.teams
            .list({
              params: { organizationId },
              query: { limit: 100, ...(cursor ? { cursor } : {}) },
            })
            .pipe(Effect.map((page) => ({ values: page.teams, nextCursor: page.nextCursor }))),
        );
      }),
    )
    .pipe(ApiClient.runtime.factory.withReactivity([K.authority, K.organization(organizationId)])),
);
