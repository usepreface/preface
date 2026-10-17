import { createBrandedId } from "#/common/branded-id";

export const OrganizationId = createBrandedId("OrganizationId");
export type OrganizationId = typeof OrganizationId.Type;
export const OrganizationMemberId = createBrandedId("OrganizationMemberId");
export type OrganizationMemberId = typeof OrganizationMemberId.Type;
export const OrganizationRoleId = createBrandedId("OrganizationRoleId");
export type OrganizationRoleId = typeof OrganizationRoleId.Type;
export const OrganizationRoleBindingId = createBrandedId("OrganizationRoleBindingId");
export type OrganizationRoleBindingId = typeof OrganizationRoleBindingId.Type;
