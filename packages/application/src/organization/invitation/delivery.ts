import { type DateTime, Effect, Redacted } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import type { OrganizationInvitationId } from "@usepreface/protocol";
import type { Organization, OrganizationRole } from "@usepreface/protocol/model";

import { AuthenticationLinks } from "#/auth/links";

export const makeInvitationDelivery = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const emails = yield* EmailJobs;
  const links = yield* AuthenticationLinks;
  return Effect.fn("InvitationDelivery.enqueue")(function* (input: {
    readonly id: OrganizationInvitationId;
    readonly organization: Organization;
    readonly email: string;
    readonly inviterName: string;
    readonly roles: readonly OrganizationRole[];
    readonly token: Redacted.Redacted<string>;
    readonly tokenHash: string;
    readonly expiresAt: DateTime.Utc;
  }) {
    const settings = yield* repository.instance.settings.find();
    if (settings === undefined)
      return yield* Effect.die(new Error("Prepared installation has no settings"));
    const url = new URL("/invitations/accept", links.dashboardOrigin ?? links.publicOrigin);
    url.hash = new URLSearchParams({
      invitationId: input.id,
      token: Redacted.value(input.token),
    }).toString();
    return yield* emails.enqueue({
      type: "organization-invitation",
      to: input.email,
      variables: {
        instanceName: settings.displayName,
        organizationName: input.organization.metadata.name,
        inviterName: input.inviterName,
        roleName: input.roles.map((role) => role.name).join(", "),
        invitationUrl: url.href,
        expiresAt: input.expiresAt,
      },
      idempotencyKey: `organization-invitation:${input.id}:${input.tokenHash}`,
      expiresAt: input.expiresAt,
    });
  });
});
