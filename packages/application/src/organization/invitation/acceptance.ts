import { DateTime, Effect, Predicate, Redacted, Schema } from "effect";

import { cryptoPurpose, SecretCrypto, TokenCrypto } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import { InvitationError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { AcceptInvitationInput } from "@usepreface/protocol/input";

import { makeSessionIssuance } from "#/auth/session-issuance";
import { OrganizationAccess } from "#/organization/access";
import { makeInvitationAdmission } from "#/organization/invitation/admission";
import { makeInvitationAudit } from "#/organization/invitation/audit";
import { makeInvitationAuthority } from "#/organization/invitation/authority";
import { TokenService } from "#/security/token";

export const makeInvitationAcceptance = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const crypto = yield* SecretCrypto;
  const tokens = yield* TokenService;
  const emails = yield* EmailJobs;
  const access = yield* OrganizationAccess;
  const authority = yield* makeInvitationAuthority;
  const audit = yield* makeInvitationAudit;
  const issueSession = yield* makeSessionIssuance;
  const admit = yield* makeInvitationAdmission;
  return Effect.fn("Application.organization.invitation.accept")(function* (
    input: AcceptInvitationInput,
    actor?: SessionActor,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(AcceptInvitationInput))(
      input,
    ).pipe(Effect.mapError(() => new InvitationError({ code: "INVALID_INPUT" })));
    const credential = yield* tokens.generateSession();
    const result = yield* transaction
      .run(
        Effect.gen(function* () {
          const { invitation } = yield* authority.requireToken(decoded, true);
          const proof = yield* repository.auth.verification.lockById(decoded.challengeId);
          if (
            proof === undefined ||
            proof.purpose !== "invitation_email" ||
            proof.context.invitationId !== invitation.id ||
            proof.subjectKey !== (yield* authority.subjectKey(invitation)) ||
            proof.consumedAt !== null ||
            proof.revokedAt !== null ||
            proof.attempts >= 5 ||
            DateTime.toEpochMillis(proof.expiresAt) <=
              DateTime.toEpochMillis(yield* DateTime.now) ||
            !(yield* random.verifyToken({
              purpose: cryptoPurpose.invitationBrowser,
              token: decoded.browserToken,
              expectedDigest: proof.browserBindingHash,
            }))
          )
            return yield* new InvitationError({ code: "INVALID_PROOF" });
          const matches =
            decoded.method === "code"
              ? yield* crypto.verifyFingerprint({
                  purpose: cryptoPurpose.invitationCode,
                  value: Redacted.make(`${proof.id}:${Redacted.value(decoded.code)}`),
                  expectedFingerprint: proof.codeHash,
                })
              : yield* random.verifyToken({
                  purpose: cryptoPurpose.invitationLink,
                  token: decoded.proofToken,
                  expectedDigest: proof.tokenHash,
                });
          if (!matches) {
            const failed = yield* repository.auth.verification.recordFailure(proof.id);
            if (failed !== undefined) {
              if (failed.attempts >= 5) yield* emails.cancel(proof.emailJobId);
              yield* audit.verification(
                invitation,
                "organization.invitation_verification_failed",
                proof.id,
                failed.attempts,
              );
            }
            // Return a value so the failed-attempt budget commits before the public error.
            return undefined;
          }
          const method = decoded.method === "code" ? "email_code" : "email_link";
          const policy = yield* repository.organization.authPolicy.findByOrganizationId(
            invitation.organizationId,
          );
          if (policy === undefined)
            return yield* new InvitationError({ code: "ASSIGNMENT_UNAVAILABLE" });
          let address = yield* repository.auth.userEmail.findActiveByEmail(invitation.email);
          let user =
            address === undefined
              ? undefined
              : yield* repository.auth.user.lockById(address.userId);
          if (actor !== undefined) {
            yield* access.requireActor(actor);
            if (user === undefined || actor.user.id !== user.id)
              return yield* new InvitationError({ code: "ACCOUNT_MISMATCH" });
          }
          if (
            address !== undefined &&
            (user === undefined ||
              user.disabledAt !== null ||
              address.removedAt !== null ||
              address.verifiedAt === null ||
              !address.loginEnabled)
          )
            return yield* new InvitationError({ code: "RECIPIENT_UNAVAILABLE" });
          if (user === undefined) {
            user = yield* repository.auth.user.create({
              metadata: { version: 1, name: decoded.displayName },
            });
            address = yield* repository.auth.userEmail.create({
              userId: user.id,
              email: invitation.email,
              isPrimary: true,
              loginEnabled: true,
              verifiedAt: yield* DateTime.now,
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
          if (address === undefined)
            return yield* Effect.die(new Error("Invitation recipient has no email identity"));
          const issued = yield* issueSession({
            userId: user.id,
            userEmailId: address.id,
            credential,
            method,
          });
          const member = yield* admit(invitation, issued.actor);
          if ((yield* repository.auth.verification.consume(proof.id)) === undefined)
            return yield* new InvitationError({ code: "INVALID_PROOF" });
          yield* emails.cancel(proof.emailJobId);
          return {
            ...issued,
            organizationId: invitation.organizationId,
            memberId: member.id,
            nextAction:
              policy.ssoMode === "required"
                ? ("authenticate_with_sso" as const)
                : ("continue" as const),
          };
        }),
      )
      .pipe(
        Effect.retry({
          times: 3,
          while: (error) =>
            Predicate.isTagged(error, "DatabaseError") &&
            Predicate.isTagged(error.reason, "UniqueViolation") &&
            error.reason.constraint === "user_email_active_email_uidx",
        }),
      );
    if (result === undefined) return yield* new InvitationError({ code: "INVALID_PROOF" });
    return result;
  });
});
