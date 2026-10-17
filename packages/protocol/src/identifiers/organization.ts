import { createBrandedId } from "#/common/branded-id";

export const OrganizationId = createBrandedId("OrganizationId");
export type OrganizationId = typeof OrganizationId.Type;
export const OrganizationMemberId = createBrandedId("OrganizationMemberId");
export type OrganizationMemberId = typeof OrganizationMemberId.Type;
export const OrganizationRoleId = createBrandedId("OrganizationRoleId");
export type OrganizationRoleId = typeof OrganizationRoleId.Type;
export const OrganizationRoleBindingId = createBrandedId("OrganizationRoleBindingId");
export type OrganizationRoleBindingId = typeof OrganizationRoleBindingId.Type;

export const OrganizationInvitationId = createBrandedId("OrganizationInvitationId");
export type OrganizationInvitationId = typeof OrganizationInvitationId.Type;
export const InvitationAssignmentId = createBrandedId("InvitationAssignmentId");
export type InvitationAssignmentId = typeof InvitationAssignmentId.Type;

export const OrganizationAuthRecoveryTokenId = createBrandedId("OrganizationAuthRecoveryTokenId");
export type OrganizationAuthRecoveryTokenId = typeof OrganizationAuthRecoveryTokenId.Type;

export const TeamId = createBrandedId("TeamId");
export type TeamId = typeof TeamId.Type;
export const TeamMemberId = createBrandedId("TeamMemberId");
export type TeamMemberId = typeof TeamMemberId.Type;
