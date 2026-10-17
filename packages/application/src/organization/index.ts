import { Effect } from "effect";

import { makeAuthenticationPolicyApplication } from "#/organization/authentication-policy";
import { makeOrganizationAuthRecovery } from "#/organization/authentication/recovery";
import { makeInvitationApplication } from "#/organization/invitation/index";
import { makeOrganizationMemberApplication } from "#/organization/member";
import { makeOrganizationApplication } from "#/organization/organization";
import { makeOrganizationOwnershipApplication } from "#/organization/ownership";
import { makeOrganizationRoleApplication } from "#/organization/role";
import { makeOrganizationRoleBindingApplication } from "#/organization/role-binding";
import { makeTeamMemberApplication } from "#/organization/team/member";
import { makeTeamApplication } from "#/organization/team/organization-team";

export const makeOrganizationsApplication = Effect.gen(function* () {
  const { organization, capabilities, authPolicy } = yield* makeOrganizationApplication;
  return {
    capabilities,
    organization: {
      organization,
      authRecovery: yield* makeOrganizationAuthRecovery,
      authPolicy: { ...authPolicy, ...(yield* makeAuthenticationPolicyApplication) },
      team: { ...(yield* makeTeamApplication), member: yield* makeTeamMemberApplication },
      invitation: yield* makeInvitationApplication,
      member: yield* makeOrganizationMemberApplication,
      role: yield* makeOrganizationRoleApplication,
      roleBinding: yield* makeOrganizationRoleBindingApplication,
      ownership: yield* makeOrganizationOwnershipApplication,
    },
  } as const;
});
