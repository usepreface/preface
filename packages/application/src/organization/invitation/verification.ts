import { DateTime, Effect, Redacted, Schema } from "effect";

import { cryptoPurpose, SecretCrypto, TokenCrypto } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import { InvitationError, VerificationId } from "@usepreface/protocol";
import { InvitationTokenInput } from "@usepreface/protocol/input";

import { AuthenticationLinks } from "#/auth/links";
import { makeInvitationAudit } from "#/organization/invitation/audit";
import { makeInvitationAuthority } from "#/organization/invitation/authority";

export const makeInvitationVerification = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const crypto = yield* SecretCrypto;
  const emails = yield* EmailJobs;
  const links = yield* AuthenticationLinks;
  const authority = yield* makeInvitationAuthority;
  const audit = yield* makeInvitationAudit;
  return Effect.fn("Application.organization.invitation.requestVerification")(function* (
    input: InvitationTokenInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(InvitationTokenInput))(
      input,
    ).pipe(Effect.mapError(() => new InvitationError({ code: "INVALID_INPUT" })));
    const id = Schema.decodeSync(VerificationId)(generateUuid7());
    const code = yield* random.randomCode();
    const linkToken = yield* random.randomToken();
    const browserToken = yield* random.randomToken();
    const codeHash = yield* crypto.fingerprint({
      purpose: cryptoPurpose.invitationCode,
      value: Redacted.make(`${id}:${Redacted.value(code)}`),
    });
    const tokenHash = yield* random.digestToken({
      purpose: cryptoPurpose.invitationLink,
      token: linkToken,
    });
    const browserBindingHash = yield* random.digestToken({
      purpose: cryptoPurpose.invitationBrowser,
      token: browserToken,
    });
    const challenge = yield* transaction.run(
      Effect.gen(function* () {
        const { invitation } = yield* authority.requireToken(decoded, true);
        yield* authority.requireInviter(invitation);
        const subjectKey = yield* authority.subjectKey(invitation);
        const retired = yield* repository.auth.verification.retirePendingBySubject(
          subjectKey,
          "invitation_email",
        );
        for (const proof of retired)
          if (proof.emailJobId !== null) yield* emails.cancel(proof.emailJobId);
        const expiresAt = DateTime.min(
          DateTime.addDuration(yield* DateTime.now, "10 minutes"),
          invitation.expiresAt,
        );
        const settings = yield* repository.instance.settings.find();
        if (settings === undefined)
          return yield* Effect.die(new Error("Prepared installation has no settings"));
        const url = new URL("/invitations/accept", links.publicOrigin);
        url.hash = new URLSearchParams({
          invitationId: invitation.id,
          token: Redacted.value(decoded.token),
          challengeId: id,
          proofToken: Redacted.value(linkToken),
        }).toString();
        const emailJobId = yield* emails.enqueue({
          type: "invitation-verification",
          to: invitation.email,
          variables: {
            instanceName: settings.displayName,
            code: Redacted.value(code),
            magicLinkUrl: url.href,
            expiresAt,
          },
          idempotencyKey: `invitation-verification:${id}`,
          expiresAt,
        });
        yield* repository.auth.verification.create({
          id,
          purpose: "invitation_email",
          subjectKey,
          userId: null,
          userEmailId: null,
          browserBindingHash,
          codeHash,
          tokenHash,
          emailJobId,
          context: { version: 1, invitationId: invitation.id },
          expiresAt,
        });
        yield* audit.verification(
          invitation,
          "organization.invitation_verification_requested",
          id,
          0,
        );
        return { challengeId: id, expiresAt };
      }),
    );
    return { challenge, browserToken };
  });
});
