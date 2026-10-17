import { Effect } from "effect";

import { makeOrganizationMemberApplication } from "#/organization/member";
import { makeOrganizationApplication } from "#/organization/organization";
import { makeOrganizationOwnershipApplication } from "#/organization/ownership";
import { makeOrganizationRoleApplication } from "#/organization/role";
import { makeOrganizationRoleBindingApplication } from "#/organization/role-binding";

export const makeOrganizationsApplication = Effect.gen(function* () {
  const { organization, capabilities, authPolicy } = yield* makeOrganizationApplication;
  return {
    capabilities,
    organization: {
      organization,
      authPolicy,
      member: yield* makeOrganizationMemberApplication,
      role: yield* makeOrganizationRoleApplication,
      roleBinding: yield* makeOrganizationRoleBindingApplication,
      ownership: yield* makeOrganizationOwnershipApplication,
    },
  } as const;
});
