import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { OrganizationId, SsoReadinessBlocker } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";
import { makeOrganizationAuthenticationEvidence } from "#/organization/authentication/evidence";
import { makeOrganizationOwnerPaths } from "#/organization/authentication/owner-paths";
import { makeOrganizationRecoveryAccess } from "#/organization/authentication/recovery-access";

export const makeOrganizationSsoReadiness = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const requireOwner = yield* makeOrganizationRecoveryAccess;
  const actors = yield* OrganizationAccess;
  const evaluate = yield* makeOrganizationAuthenticationEvidence;
  const paths = yield* makeOrganizationOwnerPaths;
  return Effect.fn("Application.organization.authPolicy.readiness")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    const { member, policy } = yield* requireOwner(actor, organizationId);
    const { evidence } = yield* actors.requireActor(actor);
    const approved =
      yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
    const connections = (yield* repository.auth.identityConnection.listByOrganization(
      organizationId,
    )).filter((connection) =>
      approved.some((entry) => entry.identityConnectionId === connection.id),
    );
    const owners = yield* paths.list(organizationId);
    const owner = owners.find((entry) => entry.memberId === member.id);
    const ssoProof = yield* evaluate(
      policy,
      evidence,
      connections.map((connection) => connection.id),
      policy.ssoMaxAgeSeconds,
    );
    const blockers: Array<typeof SsoReadinessBlocker.Type> = [];
    if (!connections.some((connection) => connection.status === "active"))
      blockers.push("NO_ACTIVE_APPROVED_CONNECTION");
    if (!owner?.ssoLinked) blockers.push("OWNER_ACCOUNT_NOT_LINKED");
    if (!ssoProof.freshSso) blockers.push("SSO_AUTHENTICATION_REQUIRED");
    if (!owner?.recoveryPrepared) blockers.push("RECOVERY_CREDENTIAL_REQUIRED");
    return {
      policyRevision: policy.revision,
      ready: blockers.length === 0,
      blockers,
      connections: connections.map((connection) => ({
        id: connection.id,
        name: connection.name,
        available: connection.status === "active",
      })),
      owners,
    };
  });
});
