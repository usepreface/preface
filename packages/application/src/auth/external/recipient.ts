import { DateTime, Effect, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { EmailAddressInput, IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { AuthFlow, IdentityConnection } from "@usepreface/protocol/model";

import type { VerifiedExternalIdentity } from "#/auth/external/proof";
import { makeOrganizationIdentityAccess } from "#/auth/organization-identity/access";
import { makeInvitationAuthority } from "#/organization/invitation/authority";

export const makeExternalRecipient = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const membership = yield* makeOrganizationIdentityAccess;
  const authority = yield* makeInvitationAuthority;
  return Effect.fn("ExternalIdentity.resolveRecipient")(function* (
    flow: AuthFlow,
    connection: IdentityConnection,
    identity: VerifiedExternalIdentity,
    actor?: SessionActor,
  ) {
    const email = yield* Schema.decodeUnknownEffect(EmailAddressInput)(identity.email).pipe(
      Effect.mapError(() => new IdentityError({ code: "IDENTITY_NOT_LINKED" })),
    );
    const now = yield* DateTime.now;
    const invitation =
      flow.invitationId === null || flow.targetOrganizationId === null
        ? undefined
        : yield* repository.organization.invitation.findById(
            flow.targetOrganizationId,
            flow.invitationId,
          );
    if (flow.intent === "accept_invitation") {
      if (
        invitation === undefined ||
        invitation.revision !== flow.invitationRevision ||
        invitation.acceptedAt !== null ||
        invitation.revokedAt !== null ||
        DateTime.toEpochMillis(invitation.expiresAt) <= DateTime.toEpochMillis(now)
      )
        return yield* new IdentityError({ code: "INVALID_FLOW" });
      if (email !== invitation.email)
        return yield* new IdentityError({ code: "RECIPIENT_MISMATCH" });
      yield* authority.requireInviter(invitation);
    }
    const address = yield* repository.auth.userEmail.findActiveByEmail(email);
    let user =
      address === undefined ? undefined : yield* repository.auth.user.lockById(address.userId);
    if (
      address !== undefined &&
      (user === undefined ||
        user.disabledAt !== null ||
        address.verifiedAt === null ||
        !address.loginEnabled ||
        address.removedAt !== null)
    )
      return yield* new IdentityError({ code: "EMAIL_UNAVAILABLE" });
    if (actor !== undefined && (user === undefined || actor.user.id !== user.id))
      return yield* new IdentityError({ code: "ACCOUNT_MISMATCH" });
    if (invitation === undefined) {
      if (user === undefined) return yield* new IdentityError({ code: "IDENTITY_NOT_LINKED" });
      if (connection.organizationId !== null && connection.organizationId !== undefined)
        yield* membership.requireMembership(connection.organizationId, user.id);
    }

    let proof: "email_challenge" | "trusted_domain" | "recent_invitation" | "google" | undefined =
      flow.emailVerifiedAt === null ? undefined : "email_challenge";
    const domain = email.slice(email.lastIndexOf("@") + 1);
    if (
      connection.provider === "google" &&
      identity.emailVerified === true &&
      (domain === "gmail.com" || domain === "googlemail.com" || identity.hostedDomain === domain)
    )
      proof = "google";
    if (connection.organizationId !== null && connection.organizationId !== undefined) {
      const domains = yield* repository.organization.domain.forConnection(
        connection.organizationId,
        connection.id,
        connection.revision,
      );
      if (domains.some((entry) => entry.domain === domain)) proof = "trusted_domain";
    }
    if (invitation !== undefined) {
      const delivery = yield* repository.jobs.email.findById(invitation.emailJobId);
      if (
        delivery?.status === "sent" &&
        delivery.sentAt !== null &&
        DateTime.toEpochMillis(delivery.sentAt) <= DateTime.toEpochMillis(now) &&
        DateTime.toEpochMillis(now) - DateTime.toEpochMillis(delivery.sentAt) < 10 * 60_000
      )
        proof = "recent_invitation";
    }
    if (proof === undefined) return { state: "verification_required" as const, email };
    if (user === undefined) {
      if (invitation === undefined || flow.displayName === null)
        return yield* new IdentityError({ code: "ADMISSION_REQUIRED" });
      user = yield* repository.auth.user.create({
        metadata: { version: 1, name: flow.displayName },
      });
      yield* repository.auth.userEmail.create({
        userId: user.id,
        email,
        isPrimary: true,
        loginEnabled: true,
        verifiedAt: now,
      });
      yield* repository.audit.event.append({
        actorKind: "user",
        actorUserId: user.id,
        eventType: "auth.email_verified",
        targetType: "user",
        targetId: user.id,
        metadata: {},
      });
    }
    return { state: "ready" as const, user, invitation, proof };
  });
});
