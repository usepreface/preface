import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import {
  OrganizationError,
  type OrganizationId,
  type OrganizationMemberId,
} from "@usepreface/protocol";

export const makeOrganizationOwnerPaths = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const list = Effect.fn("OrganizationOwnerPaths.list")(function* (organizationId: OrganizationId) {
    const owners = yield* repository.organization.roleBinding.listUsableOwners(organizationId);
    const approved =
      yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
    const connections =
      yield* repository.auth.identityConnection.listByOrganization(organizationId);
    const activeIds = new Set(
      connections
        .filter(
          (connection) =>
            connection.status === "active" &&
            approved.some((entry) => entry.identityConnectionId === connection.id),
        )
        .map((connection) => connection.id),
    );
    const paths = [];
    for (const owner of owners) {
      const address = yield* repository.auth.userEmail.findPrimaryByUserId(owner.userId);
      const usablePrimary =
        address !== undefined &&
        address.removedAt === null &&
        address.verifiedAt !== null &&
        address.loginEnabled;
      const accounts = yield* repository.auth.account.listByUserId(owner.userId);
      const recovery = yield* repository.organization.authRecoveryToken.findActiveByMember(
        organizationId,
        owner.id,
      );
      paths.push({
        memberId: owner.id,
        ssoLinked:
          usablePrimary &&
          accounts.some(
            (account) => account.unlinkedAt === null && activeIds.has(account.identityConnectionId),
          ),
        recoveryPrepared: usablePrimary && recovery !== undefined,
      });
    }
    return paths;
  });
  const requireRecoverable = Effect.fn("OrganizationOwnerPaths.requireRecoverable")(function* (
    organizationId: OrganizationId,
    excludedMemberId?: OrganizationMemberId,
  ) {
    const policy = yield* repository.organization.authPolicy.findByOrganizationId(organizationId);
    if (policy?.ssoMode !== "required") return;
    const paths = yield* list(organizationId);
    if (
      !paths.some(
        (path) => path.memberId !== excludedMemberId && path.ssoLinked && path.recoveryPrepared,
      )
    )
      return yield* new OrganizationError({ code: "LAST_AUTHENTICATION_PATH" });
  });
  return { list, requireRecoverable };
});
