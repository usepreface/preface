import { DateTime, Effect, Schema, type Redacted } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { AccountId, IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { ExternalIdentityCallbackInput } from "@usepreface/protocol/input";
import type { AuthFlow } from "@usepreface/protocol/model";

import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { AuthenticationLinks } from "#/auth/links";
import { makeOidcAccess } from "#/auth/oidc/access";
import { makeOidcEvidence } from "#/auth/oidc/evidence";
import { OidcIdentity } from "#/auth/oidc/provider";
import { OrganizationAccess } from "#/organization/access";
import { sessionLifetime } from "#/security/policy";
import { TokenService } from "#/security/token";

export const makeOidcFlowCallback = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const tokens = yield* TokenService;
  const provider = yield* OidcIdentity;
  const secrets = yield* makeIdentitySecrets;
  const access = yield* makeIdentityAccess;
  const organizationAccess = yield* makeOidcAccess;
  const actors = yield* OrganizationAccess;
  const links = yield* AuthenticationLinks;
  const recordEvidence = yield* makeOidcEvidence;
  const failFlow = Effect.fn("OidcFlow.fail")(function* (flow: AuthFlow) {
    yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.auth.authFlow.revoke(flow.id);
        yield* repository.audit.event.append({
          actorKind: flow.expectedUserId === null ? "system" : "user",
          actorUserId: flow.expectedUserId,
          ...(flow.targetOrganizationId === null
            ? {}
            : { organizationId: flow.targetOrganizationId }),
          eventType: "auth.external_flow_failed",
          targetType: "auth_flow",
          targetId: flow.id,
          metadata: { intent: flow.intent },
        });
      }),
    );
  });
  return Effect.fn("Application.auth.oidc.callback")(function* (
    input: ExternalIdentityCallbackInput,
    actor?: SessionActor,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(ExternalIdentityCallbackInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })));
    const stateHash = yield* random.digestToken({
      purpose: cryptoPurpose.authFlowState,
      token: decoded.state,
    });
    const flow = yield* transaction.run(
      Effect.gen(function* () {
        const pending = yield* repository.auth.authFlow.findByStateHash(stateHash);
        if (
          pending === undefined ||
          pending.provider !== "oidc" ||
          pending.targetOrganizationId === null ||
          !(yield* random.verifyToken({
            purpose: cryptoPurpose.authFlowBrowser,
            token: decoded.browserToken,
            expectedDigest: pending.browserBindingHash,
          }))
        )
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        if (
          pending.intent !== "sign_in" &&
          (actor === undefined ||
            actor.user.id !== pending.expectedUserId ||
            actor.session.id !== pending.initiatingSessionId)
        )
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        if (pending.intent === "sign_in" && actor !== undefined)
          return yield* new IdentityError({ code: "ALREADY_AUTHENTICATED" });
        const claimed = yield* repository.auth.authFlow.claim(pending.id);
        if (claimed === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
        return claimed;
      }),
    );
    return yield* Effect.gen(function* () {
      if (
        decoded.error !== undefined ||
        decoded.code === undefined ||
        flow.pkceVerifierCiphertext === null
      )
        return yield* new IdentityError({ code: "INVALID_FLOW" });
      const connection = yield* repository.auth.identityConnection.findById(
        flow.identityConnectionId,
      );
      if (
        connection === undefined ||
        connection.provider !== "oidc" ||
        connection.organizationId !== flow.targetOrganizationId ||
        connection.revision !== flow.connectionRevision ||
        (flow.intent !== "test" && connection.status !== "active")
      )
        return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
      if (flow.intent === "test") {
        if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
        yield* actors.requireOwner(actor, connection.organizationId);
        yield* access.requireRecentEmail(actor);
      } else {
        if (actor !== undefined)
          yield* organizationAccess.requireActorMember(actor, connection.organizationId);
        if (flow.intent === "link" && actor !== undefined) yield* access.requireRecentEmail(actor);
        if (flow.intent !== "link")
          yield* organizationAccess.requireApproved(connection.organizationId, connection.id);
        const organization = yield* repository.organization.organization.findById(
          connection.organizationId,
        );
        if (organization?.archivedAt !== null)
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
      }
      const proof = yield* secrets.decryptFlow(flow.id, flow.pkceVerifierCiphertext);
      if (
        !(yield* random.verifyToken({
          purpose: cryptoPurpose.authFlowNonce,
          token: proof.nonce,
          expectedDigest: flow.nonceHash,
        }))
      )
        return yield* new IdentityError({ code: "INVALID_FLOW" });
      const identity = yield* provider.exchangeAndVerify({
        configuration: connection.configuration,
        reauthenticate: flow.intent === "reauthenticate",
        maxAgeSeconds: flow.requestedMaxAgeSeconds,
        clientSecret: yield* secrets.decryptConnection(connection),
        redirectUri: new URL("/api/v1/auth/oidc/callback", links.publicOrigin).href,
        code: decoded.code,
        ...proof,
      });
      const credential = flow.intent === "sign_in" ? yield* tokens.generateSession() : undefined;
      return yield* transaction.run(
        Effect.gen(function* () {
          const current = yield* repository.auth.identityConnection.lockById(connection.id);
          if (
            current === undefined ||
            current.provider !== "oidc" ||
            current.organizationId !== flow.targetOrganizationId ||
            current.revision !== flow.connectionRevision ||
            (flow.intent !== "test" && current.status !== "active")
          )
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
          // These writes share connection -> organization -> user -> flow order with unlink and revocation workflows.
          if (flow.intent === "test") {
            if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
            yield* actors.requireOwner(actor, current.organizationId, { lock: true });
            yield* access.requireRecentEmail(actor);
            yield* repository.auth.identityConnection.update(
              {
                ...current,
                status: current.status === "active" ? "active" : "tested",
                testedRevision: current.revision,
                testedAt: yield* DateTime.now,
                updatedAt: yield* DateTime.now,
              },
              current.revision,
            );
            if ((yield* repository.auth.authFlow.consume(flow.id)) === undefined)
              return yield* new IdentityError({ code: "INVALID_FLOW" });
            yield* repository.audit.event.append({
              actorKind: "user",
              actorUserId: actor.user.id,
              organizationId: current.organizationId,
              eventType: "auth.connection_tested",
              targetType: "identity_connection",
              targetId: current.id,
              metadata: { revision: current.revision },
            });
            return {
              intent: flow.intent,
              returnPath: flow.returnPath,
              sessionToken: undefined,
              sessionExpiresAt: undefined,
            };
          }
          if (identity.issuer !== current.configuration.issuer)
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          // Hold organization authority stable through evidence/session issuance.
          yield* repository.organization.organization.lockById(current.organizationId);
          if (flow.intent !== "link")
            yield* organizationAccess.requireApproved(current.organizationId, current.id);
          const policy = yield* repository.organization.authPolicy.findByOrganizationId(
            current.organizationId,
          );
          if (policy === undefined)
            return yield* Effect.die(new Error("Organization has no authentication policy"));
          if (policy.ssoMode === "required") {
            const now = DateTime.toEpochMillis(yield* DateTime.now);
            const providerTime = identity.authenticatedAt;
            if (
              providerTime === undefined ||
              providerTime === null ||
              DateTime.toEpochMillis(providerTime) > now + 60_000 ||
              now - DateTime.toEpochMillis(providerTime) > policy.ssoMaxAgeSeconds * 1000
            )
              return yield* new IdentityError({ code: "RECENT_SSO_REQUIRED" });
          }
          let account = yield* repository.auth.account.findByIdentity(
            current.id,
            identity.subject,
            identity.issuer,
          );
          let sessionActor = actor;
          let sessionToken: Redacted.Redacted<string> | undefined;
          if (flow.intent === "link") {
            if (actor === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
            yield* repository.auth.user.lockById(actor.user.id);
            yield* organizationAccess.requireActorMember(actor, current.organizationId);
            yield* access.requireRecentEmail(actor);
            if (account !== undefined && account.userId !== actor.user.id)
              return yield* new IdentityError({ code: "ACCOUNT_ALREADY_LINKED" });
            const existing = yield* repository.auth.account.listByUserId(actor.user.id);
            if (
              existing.some(
                (binding) =>
                  binding.identityConnectionId === current.id &&
                  binding.unlinkedAt === null &&
                  binding.id !== account?.id,
              )
            )
              return yield* new IdentityError({ code: "ACCOUNT_ALREADY_LINKED" });
            const now = yield* DateTime.now;
            if (account === undefined)
              account = yield* repository.auth.account.create({
                id: Schema.decodeSync(AccountId)(generateUuid7()),
                userId: actor.user.id,
                identityConnectionId: current.id,
                issuer: identity.issuer,
                subject: identity.subject,
                providerEmail: identity.email,
                providerEmailVerified: identity.emailVerified,
                lastUsedAt: now,
                unlinkedAt: null,
                createdAt: now,
                updatedAt: now,
              });
            else
              account = yield* repository.auth.account.recordUsage(
                account.id,
                identity.email,
                identity.emailVerified,
                true,
              );
            yield* repository.audit.event.append({
              actorKind: "user",
              actorUserId: actor.user.id,
              organizationId: current.organizationId,
              eventType: "auth.account_linked",
              targetType: "account",
              targetId: account.id,
              metadata: { connectionId: current.id },
            });
          } else {
            if (account === undefined || account.unlinkedAt !== null)
              return yield* new IdentityError({ code: "IDENTITY_NOT_LINKED" });
            yield* organizationAccess.requireMembership(current.organizationId, account.userId);
            const user = yield* repository.auth.user.lockById(account.userId);
            if (user === undefined || user.disabledAt !== null)
              return yield* new IdentityError({ code: "IDENTITY_NOT_LINKED" });
            if (flow.intent === "reauthenticate") {
              if (actor === undefined || actor.user.id !== account.userId)
                return yield* new IdentityError({ code: "ACCOUNT_MISMATCH" });
              yield* actors.requireActor(actor);
            } else {
              if (credential === undefined)
                return yield* Effect.die(new Error("Sign-in has no session credential"));
              const address = yield* repository.auth.userEmail.findPrimaryByUserId(user.id);
              if (
                address === undefined ||
                address.verifiedAt === null ||
                !address.loginEnabled ||
                address.removedAt !== null
              )
                return yield* new IdentityError({ code: "IDENTITY_NOT_LINKED" });
              const profile = yield* repository.auth.user.findProfileById(user.id);
              if (profile === undefined)
                return yield* new IdentityError({ code: "IDENTITY_NOT_LINKED" });
              const session = yield* repository.auth.session.create({
                userId: user.id,
                tokenHash: credential.hash,
                expiresAt: DateTime.addDuration(yield* DateTime.now, sessionLifetime),
              });
              sessionActor = {
                user: {
                  id: user.id,
                  metadata: user.metadata,
                  email: profile.email,
                  emailVerifiedAt: profile.emailVerifiedAt,
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
            account = yield* repository.auth.account.recordUsage(
              account.id,
              identity.email,
              identity.emailVerified,
            );
          }
          if (account === undefined || sessionActor === undefined)
            return yield* Effect.die(new Error("Oidc completion has no account or session"));
          yield* recordEvidence(sessionActor, account, current, identity.authenticatedAt ?? null);
          if ((yield* repository.auth.authFlow.consume(flow.id)) === undefined)
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          return {
            intent: flow.intent,
            returnPath: flow.returnPath,
            sessionToken,
            sessionExpiresAt: sessionActor.session.expiresAt,
          };
        }),
      );
    }).pipe(Effect.catch((error) => failFlow(flow).pipe(Effect.andThen(Effect.fail(error)))));
  });
});
