import { Context, Effect, Layer } from "effect";

import { OrganizationAuthPolicyRepository } from "#/repositories/organization/auth-policy";
import { InvitationRepository } from "#/repositories/organization/invitation";
import { OrganizationMemberRepository } from "#/repositories/organization/member";
import { OrganizationRepository } from "#/repositories/organization/organization";
import { OrganizationRoleRepository } from "#/repositories/organization/role";
import { OrganizationRoleBindingRepository } from "#/repositories/organization/role-binding";
import { TeamRepository } from "#/repositories/organization/team";

const makeOrganizationRepositories = Effect.gen(function* () {
  return {
    team: yield* TeamRepository,
    invitation: yield* InvitationRepository,
    organization: yield* OrganizationRepository,
    member: yield* OrganizationMemberRepository,
    role: yield* OrganizationRoleRepository,
    roleBinding: yield* OrganizationRoleBindingRepository,
    authPolicy: yield* OrganizationAuthPolicyRepository,
  } as const;
});
export class OrganizationRepositories extends Context.Service<
  OrganizationRepositories,
  Effect.Success<typeof makeOrganizationRepositories>
>()("@usepreface/database/repositories/organization/OrganizationRepositories") {
  static readonly layer = Layer.effect(OrganizationRepositories, makeOrganizationRepositories).pipe(
    Layer.provide(
      Layer.mergeAll(
        TeamRepository.layer,
        InvitationRepository.layer,
        OrganizationRepository.layer,
        OrganizationMemberRepository.layer,
        OrganizationRoleRepository.layer,
        OrganizationRoleBindingRepository.layer,
        OrganizationAuthPolicyRepository.layer,
      ),
    ),
  );
}
export {
  InvitationRepository,
  OrganizationRepository,
  OrganizationMemberRepository,
  OrganizationRoleRepository,
  OrganizationRoleBindingRepository,
  OrganizationAuthPolicyRepository,
};

export { TeamRepository };
