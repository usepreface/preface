import * as atoms from "#/atoms/membership";

import { toMutation } from "./mutation";
import { toQuery } from "./query";

export const useOrganizationMembersSuspend = toMutation(atoms.organizationMembersSuspendMutation);
export const useOrganizationMembersReinstate = toMutation(
  atoms.organizationMembersReinstateMutation,
);
export const useOrganizationMembersRemove = toMutation(atoms.organizationMembersRemoveMutation);
export const useOrganizationInvitationsCreate = toMutation(
  atoms.organizationInvitationsCreateMutation,
);
export const useOrganizationInvitationsResend = toMutation(
  atoms.organizationInvitationsResendMutation,
);
export const useOrganizationInvitationsRevoke = toMutation(
  atoms.organizationInvitationsRevokeMutation,
);
export const useOrganizationRolesCreate = toMutation(atoms.organizationRolesCreateMutation);
export const useOrganizationRolesUpdate = toMutation(atoms.organizationRolesUpdateMutation);
export const useOrganizationRolesArchive = toMutation(atoms.organizationRolesArchiveMutation);
export const useOrganizationRoleBindingsGrant = toMutation(
  atoms.organizationRoleBindingsGrantMutation,
);
export const useOrganizationRoleBindingsRevoke = toMutation(
  atoms.organizationRoleBindingsRevokeMutation,
);
export const useOrganizationOwnershipGrant = toMutation(atoms.organizationOwnershipGrantMutation);
export const useOrganizationOwnershipRevoke = toMutation(atoms.organizationOwnershipRevokeMutation);
export const useOrganizationOwnershipTransfer = toMutation(
  atoms.organizationOwnershipTransferMutation,
);
export const useTeamsCreate = toMutation(atoms.teamsCreateMutation);
export const useTeamsUpdate = toMutation(atoms.teamsUpdateMutation);
export const useTeamsArchive = toMutation(atoms.teamsArchiveMutation);
export const useTeamsAddMember = toMutation(atoms.teamsAddMemberMutation);
export const useTeamsRemoveMember = toMutation(atoms.teamsRemoveMemberMutation);
export const useRoles = toQuery(atoms.rolesAtom);
export const useInvitations = toQuery(atoms.invitationsAtom);
export const useBindings = toQuery(atoms.bindingsAtom);
export const useTeam = toQuery(atoms.teamAtom);
export const useTeamAccess = toQuery(atoms.teamAccessAtom);
export const useTeamMembers = toQuery(atoms.teamMembersAtom);
export const useAllRoles = toQuery(atoms.allRolesAtom);
export const useAllMembers = toQuery(atoms.allMembersAtom);
export const useAllTeams = toQuery(atoms.allTeamsAtom);
