import { DateTime, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import type { Organization, OrganizationSecurityEmailVariables } from "@usepreface/protocol/model";

export const makeOrganizationSecurityNotifications = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const emails = yield* EmailJobs;
  return Effect.fn("OrganizationSecurityNotifications.enqueue")(function* (
    organization: Organization,
    action: OrganizationSecurityEmailVariables["action"],
    transitionId: string,
  ) {
    const owners = yield* repository.organization.roleBinding.listUsableOwners(organization.id);
    const now = yield* DateTime.now;
    for (const owner of owners) {
      const address = yield* repository.auth.userEmail.findPrimaryByUserId(owner.userId);
      if (
        address === undefined ||
        address.removedAt !== null ||
        address.verifiedAt === null ||
        !address.loginEnabled
      )
        continue;
      yield* emails.enqueue({
        type: "organization-security",
        to: address.email,
        variables: { organizationName: organization.metadata.name, action, occurredAt: now },
        idempotencyKey: `org-security:${organization.id}:${action}:${transitionId}:${owner.id}`,
        expiresAt: DateTime.addDuration(now, "7 days"),
      });
    }
  });
});
