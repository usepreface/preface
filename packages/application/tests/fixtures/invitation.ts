import { Effect, Redacted } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type {
  OrganizationId,
  OrganizationInvitationId,
  OrganizationRoleId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { InvitationTokenInput } from "@usepreface/protocol/input";

import { Application } from "../../src/index.js";
import { readEmailJob } from "./email-job.js";

export const readInvitationToken = Effect.fnUntraced(function* (
  organizationId: OrganizationId,
  invitationId: OrganizationInvitationId,
) {
  const invitation = yield* (yield* DatabaseRepository).organization.invitation.findById(
    organizationId,
    invitationId,
  );
  if (invitation === undefined) throw new Error("Expected persisted invitation");
  const payload = yield* readEmailJob(invitation.emailJobId);
  if (payload.type !== "organization-invitation") throw new Error("Expected invitation email");
  const token = new URLSearchParams(new URL(payload.variables.invitationUrl).hash.slice(1)).get(
    "token",
  );
  if (token === null) throw new Error("Expected invitation token");
  return { invitationId, token: Redacted.make(token) } satisfies InvitationTokenInput;
});

export const createTestInvitation = Effect.fnUntraced(function* (
  actor: SessionActor,
  organizationId: OrganizationId,
  email: string,
  roleIds?: readonly OrganizationRoleId[],
) {
  const repository = yield* DatabaseRepository;
  const memberRole = yield* repository.organization.role.findByKey(organizationId, "member");
  if (memberRole === undefined) throw new Error("Expected member role");
  const invitation = yield* (yield* Application).organization.invitation.create(
    actor,
    organizationId,
    { email, roleIds: roleIds ?? [memberRole.id] },
  );
  return { invitation, input: yield* readInvitationToken(organizationId, invitation.id) };
});

export const requestInvitationProof = Effect.fnUntraced(function* (input: InvitationTokenInput) {
  const issued = yield* (yield* Application).organization.invitation.requestVerification(input);
  const proof = yield* (yield* DatabaseRepository).auth.verification.findById(
    issued.challenge.challengeId,
  );
  if (proof?.emailJobId === undefined || proof.emailJobId === null)
    throw new Error("Expected invitation verification");
  const payload = yield* readEmailJob(proof.emailJobId);
  if (payload.type !== "invitation-verification" || payload.variables.magicLinkUrl === undefined)
    throw new Error("Expected invitation verification email");
  const proofToken = new URLSearchParams(new URL(payload.variables.magicLinkUrl).hash.slice(1)).get(
    "proofToken",
  );
  if (proofToken === null) throw new Error("Expected verification link token");
  return {
    ...input,
    challengeId: issued.challenge.challengeId,
    browserToken: issued.browserToken,
    code: Redacted.make(payload.variables.code),
    proofToken: Redacted.make(proofToken),
    displayName: "Invited Colleague",
    method: "code" as const,
  };
});
