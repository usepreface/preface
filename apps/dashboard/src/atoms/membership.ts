import { Effect } from "effect";

import type {
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
  () => [K.organization],
);
export const organizationMembersReinstateMutation = mutation(
  (client) => client.organizationMembers.reinstate,
  () => [K.organization],
);
export const organizationMembersRemoveMutation = mutation(
  (client) => client.organizationMembers.remove,
  () => [K.organization],
);
export const organizationInvitationsCreateMutation = mutation(
  (client) => client.organizationInvitations.create,
  () => [K.organization],
);
export const organizationInvitationsResendMutation = mutation(
  (client) => client.organizationInvitations.resend,
  () => [K.organization],
);
export const organizationInvitationsRevokeMutation = mutation(
  (client) => client.organizationInvitations.revoke,
  () => [K.organization],
);
export const organizationRolesCreateMutation = mutation(
  (client) => client.organizationRoles.create,
  () => [K.organization],
);
export const organizationRolesUpdateMutation = mutation(
  (client) => client.organizationRoles.update,
  () => [K.organization],
);
export const organizationRolesArchiveMutation = mutation(
  (client) => client.organizationRoles.archive,
  () => [K.organization],
);
export const organizationRoleBindingsGrantMutation = mutation(
  (client) => client.organizationRoleBindings.grant,
  () => [K.organization],
);
export const organizationRoleBindingsRevokeMutation = mutation(
  (client) => client.organizationRoleBindings.revoke,
  () => [K.organization],
);
export const organizationOwnershipGrantMutation = mutation(
  (client) => client.organizationOwnership.grant,
  () => [K.organization],
);
export const organizationOwnershipRevokeMutation = mutation(
  (client) => client.organizationOwnership.revoke,
  () => [K.organization],
);
export const organizationOwnershipTransferMutation = mutation(
  (client) => client.organizationOwnership.transfer,
  () => [K.organization],
);
export const teamsCreateMutation = mutation(
  (client) => client.teams.create,
  () => [K.organization],
);
export const teamsUpdateMutation = mutation(
  (client) => client.teams.update,
  () => [K.organization],
);
export const teamsArchiveMutation = mutation(
  (client) => client.teams.archive,
  () => [K.organization],
);
export const teamsAddMemberMutation = mutation(
  (client) => client.teams.addMember,
  () => [K.organization],
);
export const teamsRemoveMemberMutation = mutation(
  (client) => client.teams.removeMember,
  () => [K.organization],
);

export const rolesAtom = (cursor?: OrganizationRoleId, scopeKind: RoleScope = "organization") =>
  ApiClient.query(
    "organizationRoles",
    "list",
    requestFields({
      query: { limit: 100, includeArchived: true, scopeKind, ...(cursor ? { cursor } : {}) },
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const invitationsAtom = (cursor?: OrganizationInvitationId) =>
  ApiClient.query(
    "organizationInvitations",
    "list",
    requestFields({
      query: { limit: 100, ...(cursor ? { cursor } : {}) },
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const bindingsAtom = (memberId: OrganizationMemberId, teamId?: TeamId) =>
  ApiClient.query(
    "organizationRoleBindings",
    "list",
    requestFields({
      query: { memberId, teamId },
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const teamAtom = (teamId: TeamId) =>
  ApiClient.query(
    "teams",
    "get",
    requestFields({
      params: { teamId },
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const teamAccessAtom = (teamId: TeamId) =>
  ApiClient.query(
    "teams",
    "access",
    requestFields({
      params: { teamId },
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const teamMembersAtom = (teamId: TeamId, cursor?: TeamMemberId) =>
  ApiClient.query(
    "teams",
    "members",
    requestFields({
      params: { teamId },
      query: { cursor, limit: 100 },
      reactivityKeys: [K.authority, K.organization],
    }),
  );
export const allRolesAtom = ApiClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const scopes = yield* Effect.forEach(
        ["organization", "team"] as const,
        (scopeKind) =>
          collectPages((cursor?: OrganizationRoleId) =>
            client.organizationRoles
              .list({
                query: { limit: 100, scopeKind, ...(cursor ? { cursor } : {}) },
              })
              .pipe(Effect.map((page) => ({ values: page.roles, nextCursor: page.nextCursor }))),
          ),
        { concurrency: 2 },
      );
      return scopes.flat();
    }),
  )
  .pipe(ApiClient.runtime.factory.withReactivity([K.authority, K.organization]));

export const allMembersAtom = ApiClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* collectPages((cursor?: OrganizationMemberId) =>
        client.organizationMembers
          .list({
            query: { limit: 100, ...(cursor ? { cursor } : {}) },
          })
          .pipe(Effect.map((page) => ({ values: page.members, nextCursor: page.nextCursor }))),
      );
    }),
  )
  .pipe(ApiClient.runtime.factory.withReactivity([K.authority, K.organization]));

export const allTeamsAtom = ApiClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* collectPages((cursor?: TeamId) =>
        client.teams
          .list({
            query: { limit: 100, ...(cursor ? { cursor } : {}) },
          })
          .pipe(Effect.map((page) => ({ values: page.teams, nextCursor: page.nextCursor }))),
      );
    }),
  )
  .pipe(ApiClient.runtime.factory.withReactivity([K.authority, K.organization]));
