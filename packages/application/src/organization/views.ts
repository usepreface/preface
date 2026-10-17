import type {
  PublicOrganization,
  PublicOrganizationMember,
  PublicOrganizationRole,
  PublicOrganizationRoleBinding,
  OrganizationAccessInfo,
} from "@usepreface/protocol/dto";
import type {
  Organization,
  OrganizationMember,
  OrganizationRole,
  OrganizationRoleBinding,
} from "@usepreface/protocol/model";

import type { ResolvedOrganizationAccess } from "#/organization/access";

export const publicOrganization = (organization: Organization): PublicOrganization => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  archivedAt: organization.archivedAt,
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
});
export const publicRole = (role: OrganizationRole): PublicOrganizationRole => ({
  id: role.id,
  key: role.key,
  name: role.name,
  kind: role.kind,
  permissions: role.permissions,
  archivedAt: role.archivedAt,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});
export const publicMember = (
  member: OrganizationMember,
  displayName: string,
  roles: readonly OrganizationRole[],
): PublicOrganizationMember => ({
  id: member.id,
  userId: member.userId,
  displayName,
  joinedAt: member.joinedAt,
  suspendedAt: member.suspendedAt,
  removedAt: member.removedAt,
  roles: roles.map((role) => ({ id: role.id, key: role.key, name: role.name, kind: role.kind })),
});
export const publicBinding = (binding: OrganizationRoleBinding): PublicOrganizationRoleBinding => ({
  id: binding.id,
  roleId: binding.roleId,
  memberId: binding.memberId,
  grantedByMemberId: binding.grantedByMemberId,
  createdAt: binding.createdAt,
  revokedAt: binding.revokedAt,
});
export const publicAccess = (access: ResolvedOrganizationAccess): OrganizationAccessInfo => ({
  memberId: access.member.id,
  isOwner: access.isOwner,
  permissions: access.permissions,
});
