import { DateTime, Effect, Predicate, Schema, type Redacted } from "effect";

import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { AccountId, IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { AuthFlow } from "@usepreface/protocol/model";

import { matchesFlowActor } from "#/auth/external/binding";
import {
  externalProofExpiresAt,
  makeExternalProof,
  type VerifiedExternalIdentity,
} from "#/auth/external/proof";
import { makeExternalRecipient } from "#/auth/external/recipient";
import { makeGoogleEvidence } from "#/auth/google/evidence";
import { makeIdentityAccess } from "#/auth/identity-access";
import { makeOrganizationIdentityAccess } from "#/auth/organization-identity/access";
import { makeOrganizationIdentityEvidence } from "#/auth/organization-identity/evidence";
import { isPendingKeyUsable } from "#/auth/saml/keys";
import { OrganizationAccess } from "#/organization/access";
import { makeInvitationAdmission } from "#/organization/invitation/admission";
import { sessionLifetime } from "#/security/policy";
import { TokenService } from "#/security/token";

export const makeExternalCompletion = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const tokens = yield* TokenService;
  const actors = yield* OrganizationAccess;
  const access = yield* makeIdentityAccess;
  const organizationAccess = yield* makeOrganizationIdentityAccess;
  const resolve = yield* makeExternalRecipient;
  const proofs = yield* makeExternalProof;
  const admit = yield* makeInvitationAdmission;
  const googleEvidence = yield* makeGoogleEvidence;
  const organizationEvidence = yield* makeOrganizationIdentityEvidence;

  return Effect.fn("ExternalIdentity.complete")(function* (
    flow: AuthFlow,
    identity: VerifiedExternalIdentity,
    actor?: SessionActor,
  ) {
    if (!matchesFlowActor(flow, actor)) return yield* new IdentityError({ code: "INVALID_FLOW" });
    const credential =
      flow.intent === "sign_in" || flow.intent === "accept_invitation"
        ? yield* tokens.generateSession()
        : undefined;
    const ciphertext =
      flow.verifiedIdentityCiphertext ?? (yield* proofs.encrypt(flow.id, identity));
    return yield* transaction
      .run(
        Effect.gen(function* () {
          if (flow.intent === "test" && flow.provider === "google")
            yield* repository.instance.installation.lock();
          const connection = yield* repository.auth.identityConnection.lockById(
            flow.identityConnectionId,
          );
          if (
            connection === undefined ||
            connection.provider !== flow.provider ||
            connection.revision !== flow.connectionRevision ||
            (flow.intent !== "test" && connection.status !== "active")
          )
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
          const now = yield* DateTime.now;
          const persisted = yield* repository.auth.authFlow.findById(flow.id);
          if (
            persisted === undefined ||
            persisted.claimedAt === null ||
            persisted.consumedAt !== null ||
            persisted.revokedAt !== null ||
            DateTime.toEpochMillis(persisted.expiresAt) <= DateTime.toEpochMillis(now)
          )
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          if (
            (identity.validUntil !== null &&
              DateTime.toEpochMillis(identity.validUntil) <= DateTime.toEpochMillis(now)) ||
            (identity.sessionExpiresAt !== null &&
              DateTime.toEpochMillis(identity.sessionExpiresAt) <= DateTime.toEpochMillis(now))
          )
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          if (
            connection.provider !== "google" &&
            connection.organizationId !== flow.targetOrganizationId
          )
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          if (flow.targetOrganizationId !== null) {
            const organization = yield* repository.organization.organization.lockById(
              flow.targetOrganizationId,
            );
            if (organization === undefined || organization.archivedAt !== null)
              return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
          }
          if (flow.intent === "test") {
            if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
            if (connection.provider === "google") yield* access.requireInstanceOwner(actor);
            else {
              yield* actors.requireOwner(actor, connection.organizationId);
              yield* access.requireRecentEmail(actor);
            }
            if (flow.signingKeyId !== null) {
              const key = yield* repository.auth.identityConnectionKey.find(
                flow.signingKeyId,
                true,
              );
              if (
                connection.provider !== "saml" ||
                key?.identityConnectionId !== connection.id ||
                !isPendingKeyUsable(key, connection.revision, now)
              )
                return yield* new IdentityError({ code: "KEY_UNAVAILABLE" });
              yield* repository.auth.identityConnectionKey.update({ ...key, testedAt: now });
              yield* repository.audit.event.append({
                actorKind: "user",
                actorUserId: actor.user.id,
                organizationId: connection.organizationId,
                eventType: "auth.connection_key_tested",
                targetType: "identity_connection_key",
                targetId: key.id,
                metadata: { connectionId: connection.id, revision: connection.revision },
              });
            } else {
              yield* repository.auth.identityConnection.update(
                {
                  ...connection,
                  status: connection.status === "active" ? "active" : "tested",
                  testedRevision: connection.revision,
                  testedAt: now,
                  updatedAt: now,
                },
                connection.revision,
              );
            }
            if ((yield* repository.auth.authFlow.consume(flow.id)) === undefined)
              return yield* new IdentityError({ code: "INVALID_FLOW" });
            if (flow.signingKeyId === null)
              yield* repository.audit.event.append({
                actorKind: "user",
                actorUserId: actor.user.id,
                ...(connection.organizationId ? { organizationId: connection.organizationId } : {}),
                eventType: "auth.connection_tested",
                targetType: "identity_connection",
                targetId: connection.id,
                metadata: { revision: connection.revision },
              });
            return {
              intent: flow.intent,
              nextAction: "continue" as const,
              flowId: flow.id,
              returnPath: flow.returnPath,
              sessionToken: undefined,
              sessionExpiresAt: undefined,
            };
          }
          const issuer =
            connection.provider === "google"
              ? "https://accounts.google.com"
              : connection.provider === "oidc"
                ? connection.configuration.issuer
                : connection.configuration.idp?.entityId;
          if (identity.issuer !== issuer) return yield* new IdentityError({ code: "INVALID_FLOW" });
          if (actor !== undefined) yield* actors.requireActor(actor);
          if (connection.provider !== "google" && flow.intent !== "link")
            yield* organizationAccess.requireApproved(connection.organizationId, connection.id);
          const policy =
            flow.targetOrganizationId === null
              ? undefined
              : yield* repository.organization.authPolicy.findByOrganizationId(
                  flow.targetOrganizationId,
                );
          if (flow.targetOrganizationId !== null && policy === undefined)
            return yield* Effect.die(new Error("Organization has no authentication policy"));
          if (
            connection.provider === "google" &&
            policy !== undefined &&
            (policy.ssoMode === "required" || !policy.allowedMethods.includes("google"))
          )
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
          if (
            connection.provider !== "google" &&
            policy?.ssoMode === "required" &&
            (identity.authenticatedAt === null ||
              DateTime.toEpochMillis(identity.authenticatedAt) >
                DateTime.toEpochMillis(now) + 60_000 ||
              DateTime.toEpochMillis(now) - DateTime.toEpochMillis(identity.authenticatedAt) >
                policy.ssoMaxAgeSeconds * 1000)
          )
            return yield* new IdentityError({ code: "RECENT_SSO_REQUIRED" });

          let account = yield* repository.auth.account.findByIdentity(
            connection.id,
            identity.subject,
            identity.issuer,
          );
          if (flow.intent === "reauthenticate" && account === undefined)
            return yield* new IdentityError({ code: "IDENTITY_NOT_LINKED" });
          let linkingProof:
            | "explicit"
            | "email_challenge"
            | "trusted_domain"
            | "recent_invitation"
            | "google" = "explicit";
          let userId = account?.userId;
          if (flow.intent === "link") {
            if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
            yield* repository.auth.user.lockById(actor.user.id);
            yield* access.requireRecentEmail(actor);
            if (connection.provider !== "google")
              yield* organizationAccess.requireActorMember(actor, connection.organizationId);
            if (account !== undefined && account.userId !== actor.user.id)
              return yield* new IdentityError({ code: "ACCOUNT_ALREADY_LINKED" });
            userId = actor.user.id;
          } else {
            if (account !== undefined && account.unlinkedAt !== null)
              return yield* new IdentityError({ code: "IDENTITY_NOT_LINKED" });
            if (account === undefined || flow.intent === "accept_invitation") {
              const recipient = yield* resolve(flow, connection, identity, actor);
              if (recipient.state === "verification_required") {
                if (flow.verifiedIdentityCiphertext === null) {
                  if (
                    (yield* repository.auth.authFlow.stageVerifiedIdentity(flow.id, ciphertext)) ===
                    undefined
                  )
                    return yield* new IdentityError({ code: "INVALID_FLOW" });
                  yield* repository.audit.event.append({
                    actorKind: flow.expectedUserId === null ? "system" : "user",
                    actorUserId: flow.expectedUserId,
                    ...(flow.targetOrganizationId
                      ? { organizationId: flow.targetOrganizationId }
                      : {}),
                    eventType: "auth.external_flow_verified",
                    targetType: "auth_flow",
                    targetId: flow.id,
                    metadata: { intent: flow.intent },
                  });
                }
                return {
                  intent: flow.intent,
                  nextAction: "verify_email" as const,
                  flowId: flow.id,
                  expiresAt: externalProofExpiresAt(flow.expiresAt, identity),
                  returnPath: `/auth/verify-email?flowId=${flow.id}`,
                  sessionToken: undefined,
                  sessionExpiresAt: undefined,
                };
              }
              if (account !== undefined && account.userId !== recipient.user.id)
                return yield* new IdentityError({ code: "ACCOUNT_MISMATCH" });
              userId = recipient.user.id;
              linkingProof = recipient.proof;
            }
            if (userId === undefined)
              return yield* new IdentityError({ code: "IDENTITY_NOT_LINKED" });
            if (flow.intent !== "accept_invitation" && connection.provider !== "google")
              yield* organizationAccess.requireMembership(connection.organizationId, userId);
            if (
              flow.intent === "reauthenticate" &&
              (actor === undefined || actor.user.id !== userId)
            )
              return yield* new IdentityError({ code: "ACCOUNT_MISMATCH" });
          }
          if (userId === undefined)
            return yield* Effect.die(new Error("External identity has no recipient"));
          const user = yield* repository.auth.user.lockById(userId);
          if (actor !== undefined) yield* actors.requireActor(actor);
          const address = yield* repository.auth.userEmail.findPrimaryByUserId(userId);
          if (
            user === undefined ||
            user.disabledAt !== null ||
            address === undefined ||
            address.verifiedAt === null ||
            !address.loginEnabled ||
            address.removedAt !== null
          )
            return yield* new IdentityError({ code: "EMAIL_UNAVAILABLE" });
          if (account === undefined) {
            const existing = yield* repository.auth.account.listByUserId(user.id);
            if (
              existing.some(
                (entry) =>
                  entry.identityConnectionId === connection.id && entry.unlinkedAt === null,
              )
            )
              return yield* new IdentityError({ code: "ACCOUNT_ALREADY_LINKED" });
            account = yield* repository.auth.account.create({
              id: Schema.decodeSync(AccountId)(generateUuid7()),
              userId: user.id,
              identityConnectionId: connection.id,
              issuer: identity.issuer,
              subject: identity.subject,
              providerEmail: identity.email,
              providerEmailVerified: identity.emailVerified,
              lastUsedAt: now,
              unlinkedAt: null,
              createdAt: now,
              updatedAt: now,
            });
            yield* repository.audit.event.append({
              actorKind: "user",
              actorUserId: user.id,
              ...(connection.organizationId ? { organizationId: connection.organizationId } : {}),
              eventType: "auth.account_linked",
              targetType: "account",
              targetId: account.id,
              metadata: { connectionId: connection.id, linkSource: linkingProof },
            });
          } else {
            const reconnecting = flow.intent === "link" && account.unlinkedAt !== null;
            account = yield* repository.auth.account.recordUsage(
              account.id,
              identity.email,
              identity.emailVerified,
              flow.intent === "link",
            );
            if (reconnecting)
              yield* repository.audit.event.append({
                actorKind: "user",
                actorUserId: user.id,
                ...(connection.organizationId ? { organizationId: connection.organizationId } : {}),
                eventType: "auth.account_linked",
                targetType: "account",
                targetId: account.id,
                metadata: { connectionId: connection.id, linkSource: "explicit" },
              });
          }
          let sessionActor = actor;
          let sessionToken: Redacted.Redacted<string> | undefined;
          if (credential !== undefined) {
            const expiresAt = DateTime.makeUnsafe(
              Math.min(
                DateTime.toEpochMillis(DateTime.addDuration(now, sessionLifetime)),
                identity.sessionExpiresAt === null
                  ? Infinity
                  : DateTime.toEpochMillis(identity.sessionExpiresAt),
              ),
            );
            const session = yield* repository.auth.session.create({
              userId: user.id,
              tokenHash: credential.hash,
              expiresAt,
            });
            sessionActor = {
              user: {
                id: user.id,
                metadata: user.metadata,
                email: address.email,
                emailVerifiedAt: address.verifiedAt,
              },
              session: { id: session.id, expiresAt: session.expiresAt },
            };
            sessionToken = credential.token;
            yield* repository.audit.event.append({
              actorKind: "user",
              actorUserId: user.id,
              eventType: "auth.session_created",
              targetType: "session",
              targetId: session.id,
              metadata: {},
            });
          }
          if (sessionActor === undefined)
            return yield* Effect.die(new Error("External identity has no session"));
          if (connection.provider === "google")
            yield* googleEvidence(sessionActor, account, connection);
          else
            yield* organizationEvidence(
              sessionActor,
              account,
              connection,
              identity.authenticatedAt,
              identity.sessionExpiresAt,
            );
          if (flow.invitationId !== null && flow.targetOrganizationId !== null) {
            const invitation = yield* repository.organization.invitation.findById(
              flow.targetOrganizationId,
              flow.invitationId,
            );
            if (invitation === undefined || invitation.revision !== flow.invitationRevision)
              return yield* new IdentityError({ code: "INVALID_FLOW" });
            yield* admit(invitation, sessionActor);
          }
          if ((yield* repository.auth.authFlow.consume(flow.id)) === undefined)
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          return {
            intent: flow.intent,
            nextAction: "continue" as const,
            flowId: flow.id,
            returnPath: flow.returnPath,
            sessionToken,
            sessionExpiresAt: sessionActor.session.expiresAt,
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
  });
});
