import { defineRelationsPart } from "drizzle-orm";

import * as schema from "#/schema/index";

export const organizationRelations = defineRelationsPart(schema, (r) => ({
  organizationInvitation: {
    organization: r.one.organization({
      from: r.organizationInvitation.organizationId,
      to: r.organization.id,
      optional: false,
    }),
    invitedBy: r.one.organizationMember({
      from: [r.organizationInvitation.invitedByMemberId, r.organizationInvitation.organizationId],
      to: [r.organizationMember.id, r.organizationMember.organizationId],
      optional: false,
    }),
    assignments: r.many.invitationAssignment({
      from: [r.organizationInvitation.id, r.organizationInvitation.organizationId],
      to: [r.invitationAssignment.invitationId, r.invitationAssignment.organizationId],
    }),
  },
  invitationAssignment: {
    invitation: r.one.organizationInvitation({
      from: [r.invitationAssignment.invitationId, r.invitationAssignment.organizationId],
      to: [r.organizationInvitation.id, r.organizationInvitation.organizationId],
      optional: false,
    }),
    role: r.one.organizationRole({
      from: [r.invitationAssignment.roleId, r.invitationAssignment.organizationId],
      to: [r.organizationRole.id, r.organizationRole.organizationId],
      optional: false,
    }),
  },
  organization: {
    createdBy: r.one.user({ from: r.organization.createdByUserId, to: r.user.id, optional: false }),
    members: r.many.organizationMember({
      from: r.organization.id,
      to: r.organizationMember.organizationId,
    }),
    roles: r.many.organizationRole({
      from: r.organization.id,
      to: r.organizationRole.organizationId,
    }),
    authPolicy: r.one.organizationAuthPolicy({
      from: r.organization.id,
      to: r.organizationAuthPolicy.organizationId,
    }),
  },
  organizationMember: {
    user: r.one.user({ from: r.organizationMember.userId, to: r.user.id, optional: false }),
    organization: r.one.organization({
      from: r.organizationMember.organizationId,
      to: r.organization.id,
      optional: false,
    }),
    bindings: r.many.organizationRoleBinding({
      from: [r.organizationMember.id, r.organizationMember.organizationId],
      to: [r.organizationRoleBinding.memberId, r.organizationRoleBinding.organizationId],
    }),
  },
  organizationRole: {
    organization: r.one.organization({
      from: r.organizationRole.organizationId,
      to: r.organization.id,
      optional: false,
    }),
  },
  organizationRoleBinding: {
    role: r.one.organizationRole({
      from: [r.organizationRoleBinding.roleId, r.organizationRoleBinding.organizationId],
      to: [r.organizationRole.id, r.organizationRole.organizationId],
      optional: false,
    }),
    member: r.one.organizationMember({
      from: [r.organizationRoleBinding.memberId, r.organizationRoleBinding.organizationId],
      to: [r.organizationMember.id, r.organizationMember.organizationId],
      optional: false,
    }),
    grantedBy: r.one.organizationMember({
      from: [r.organizationRoleBinding.grantedByMemberId, r.organizationRoleBinding.organizationId],
      to: [r.organizationMember.id, r.organizationMember.organizationId],
      optional: false,
    }),
  },
  organizationAuthPolicy: {
    updatedBy: r.one.organizationMember({
      from: [r.organizationAuthPolicy.updatedByMemberId, r.organizationAuthPolicy.organizationId],
      to: [r.organizationMember.id, r.organizationMember.organizationId],
      optional: false,
    }),
    organization: r.one.organization({
      from: r.organizationAuthPolicy.organizationId,
      to: r.organization.id,
      optional: false,
    }),
  },
}));
