import { Effect, Schema } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { IdentityError, type OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { UpdateOrganizationAuthPolicyInput } from "@usepreface/protocol/input";

import { makeIdentityAccess } from "#/auth/identity-access";
import { makeOidcAccess } from "#/auth/oidc/access";
import { OrganizationAccess } from "#/organization/access";
import { makeOrganizationAuthenticationEvidence } from "#/organization/authentication/evidence";
import { makeOrganizationSecurityNotifications } from "#/organization/authentication/notifications";
import { makeOrganizationOwnerPaths } from "#/organization/authentication/owner-paths";
import { makeOrganizationSsoReadiness } from "#/organization/authentication/readiness";
import { makeRecoveryCredentialVerification } from "#/organization/authentication/recovery-credential";
import { organizationAuthPolicyView } from "#/organization/authentication/views";

export const makeAuthenticationPolicyApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const organizations = yield* OrganizationAccess;
  const oidcAccess = yield* makeOidcAccess;
  const access = yield* makeIdentityAccess;
  const evaluate = yield* makeOrganizationAuthenticationEvidence;
  const paths = yield* makeOrganizationOwnerPaths;
  const verifyRecovery = yield* makeRecoveryCredentialVerification;
  const notify = yield* makeOrganizationSecurityNotifications;
  const readiness = yield* makeOrganizationSsoReadiness;
  const methods = Effect.fn("Application.organization.authPolicy.methods")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    // Enrollment and discovery remain available before the member satisfies organization policy.
    yield* oidcAccess.requireActorMember(actor, organizationId);
    const { evidence } = yield* organizations.requireActor(actor);
    const policy = yield* repository.organization.authPolicy.findByOrganizationId(organizationId);
    if (policy === undefined)
      return yield* Effect.die(new Error("Organization has no authentication policy"));
    const google = yield* repository.auth.identityConnection.findGoogle();
    const approved =
      yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
    const ids = approved.map((entry) => entry.identityConnectionId);
    const connections =
      yield* repository.auth.identityConnection.listByOrganization(organizationId);
    const accounts = yield* repository.auth.account.listByUserId(actor.user.id);
    const authentication = yield* evaluate(policy, evidence, ids);
    return {
      revision: policy.revision,
      ssoMode: policy.ssoMode,
      ssoMaxAgeSeconds: policy.ssoMaxAgeSeconds,
      authenticationSatisfied: authentication.accepted,
      nextAction: authentication.accepted
        ? ("continue" as const)
        : policy.ssoMode === "optional"
          ? ("authenticate_with_email" as const)
          : authentication.ssoLinkedEvidence
            ? ("reauthenticate_with_sso" as const)
            : ("authenticate_with_sso" as const),
      email: true as const,
      emailSatisfiesOrganization: policy.ssoMode === "optional",
      googleEnabled: policy.allowedMethods.includes("google"),
      googleAvailable: google?.status === "active",
      googleEffective:
        policy.ssoMode === "optional" &&
        policy.allowedMethods.includes("google") &&
        google?.status === "active",
      saml: connections
        .filter((connection) => connection.provider === "saml" && ids.includes(connection.id))
        .map((connection) => ({
          id: connection.id,
          name: connection.name,
          available: connection.status === "active",
          linked: accounts.some(
            (account) =>
              account.identityConnectionId === connection.id && account.unlinkedAt === null,
          ),
        })),
      oidc: connections
        .filter((connection) => connection.provider === "oidc" && ids.includes(connection.id))
        .map((connection) => ({
          id: connection.id,
          name: connection.name,
          available: connection.status === "active",
          linked: accounts.some(
            (account) =>
              account.identityConnectionId === connection.id && account.unlinkedAt === null,
          ),
        })),
    };
  });
  const update = Effect.fn("Application.organization.authPolicy.update")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: UpdateOrganizationAuthPolicyInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(
      Schema.toType(UpdateOrganizationAuthPolicyInput),
    )(input).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    if (
      (decoded.googleEnabled === undefined &&
        decoded.oidcConnectionIds === undefined &&
        decoded.samlConnectionIds === undefined &&
        decoded.ssoMode === undefined &&
        decoded.ssoMaxAgeSeconds === undefined) ||
      (decoded.oidcConnectionIds !== undefined &&
        new Set(decoded.oidcConnectionIds).size !== decoded.oidcConnectionIds.length) ||
      (decoded.samlConnectionIds !== undefined &&
        new Set(decoded.samlConnectionIds).size !== decoded.samlConnectionIds.length)
    )
      return yield* new IdentityError({ code: "INVALID_INPUT" });
    yield* organizations.requireOwner(actor, organizationId);
    yield* access.requireRecentEmail(actor);
    return yield* transaction.run(
      Effect.gen(function* () {
        // Lock connection trust before organization authority, matching OIDC completion/configuration.
        const google = yield* repository.auth.identityConnection.findGoogle();
        const ids = [
          ...new Set([
            ...(decoded.oidcConnectionIds ?? []),
            ...(decoded.samlConnectionIds ?? []),
            ...(google === undefined ? [] : [google.id]),
          ]),
        ].toSorted();
        const locked = [];
        for (const id of ids) locked.push(yield* repository.auth.identityConnection.lockById(id));
        const resolved = yield* organizations.requireOwner(actor, organizationId, { lock: true });
        yield* access.requireRecentEmail(actor);
        if (resolved.policy.revision !== decoded.expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        const previous = (yield* repository.organization.authPolicyConnection.listByOrganization(
          organizationId,
        )).map((entry) => entry.identityConnectionId);
        const configured =
          yield* repository.auth.identityConnection.listByOrganization(organizationId);
        const previousOidc = previous.filter((id) =>
          configured.some((connection) => connection.id === id && connection.provider === "oidc"),
        );
        const previousSaml = previous.filter((id) =>
          configured.some((connection) => connection.id === id && connection.provider === "saml"),
        );
        const oidcConnectionIds = [...(decoded.oidcConnectionIds ?? previousOidc)].toSorted();
        const samlConnectionIds = [...(decoded.samlConnectionIds ?? previousSaml)].toSorted();
        const approvedIds = [...oidcConnectionIds, ...samlConnectionIds].toSorted();
        if (approvedIds.length > 20) return yield* new IdentityError({ code: "INVALID_INPUT" });
        for (const id of samlConnectionIds) {
          const connection = locked.find((candidate) => candidate?.id === id);
          if (
            decoded.samlConnectionIds !== undefined &&
            (connection?.provider !== "saml" ||
              connection.organizationId !== organizationId ||
              (!previous.includes(id) && connection.status !== "active"))
          )
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        }
        for (const id of oidcConnectionIds) {
          const connection = locked.find((candidate) => candidate?.id === id);
          if (
            decoded.oidcConnectionIds !== undefined &&
            (connection?.provider !== "oidc" ||
              connection.organizationId !== organizationId ||
              (!previous.includes(id) && connection.status !== "active"))
          )
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        }
        const googleEnabled =
          decoded.googleEnabled ?? resolved.policy.allowedMethods.includes("google");
        if (
          decoded.googleEnabled === true &&
          locked.find((connection) => connection?.id === google?.id)?.status !== "active"
        )
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        const ssoMode = decoded.ssoMode ?? resolved.policy.ssoMode;
        const ssoMaxAgeSeconds = decoded.ssoMaxAgeSeconds ?? resolved.policy.ssoMaxAgeSeconds;
        const allowedMethods = [
          "email_code" as const,
          "email_link" as const,
          ...(googleEnabled ? ["google" as const] : []),
          ...(oidcConnectionIds.length > 0 ? ["oidc" as const] : []),
          ...(samlConnectionIds.length > 0 ? ["saml" as const] : []),
        ];
        if (
          ssoMode === resolved.policy.ssoMode &&
          ssoMaxAgeSeconds === resolved.policy.ssoMaxAgeSeconds &&
          googleEnabled === resolved.policy.allowedMethods.includes("google") &&
          JSON.stringify(approvedIds) === JSON.stringify([...previous].toSorted())
        )
          return organizationAuthPolicyView(resolved.policy, oidcConnectionIds, samlConnectionIds);
        const enabling = ssoMode === "required" && resolved.policy.ssoMode !== "required";
        if (enabling) {
          if (decoded.recoveryCredential === undefined)
            return yield* new IdentityError({ code: "RECOVERY_CREDENTIAL_REQUIRED" });
          yield* verifyRecovery(organizationId, resolved.member.id, decoded.recoveryCredential);
          const { evidence } = yield* organizations.requireActor(actor);
          const proof = yield* evaluate(
            { ...resolved.policy, allowedMethods },
            evidence,
            approvedIds,
            300,
          );
          if (!proof.freshSso) return yield* new IdentityError({ code: "RECENT_SSO_REQUIRED" });
        }
        const policy = yield* repository.organization.authPolicy.update(
          organizationId,
          resolved.member.id,
          decoded.expectedRevision,
          {
            allowedMethods,
            ssoMode,
            ssoMaxAgeSeconds,
          },
        );
        if (policy === undefined) return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        if (decoded.oidcConnectionIds !== undefined || decoded.samlConnectionIds !== undefined)
          yield* repository.organization.authPolicyConnection.replaceForOrganization(
            organizationId,
            resolved.member.id,
            approvedIds,
          );
        yield* paths.requireRecoverable(organizationId);
        // Policy changes must leave the acting owner able to access the resulting required policy.
        if (ssoMode === "required") {
          const { evidence } = yield* organizations.requireActor(actor);
          const proof = yield* evaluate(policy, evidence, approvedIds);
          if (!proof.accepted) return yield* new IdentityError({ code: "RECENT_SSO_REQUIRED" });
        }
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "organization.auth_policy_updated",
          targetType: "organization",
          targetId: organizationId,
          metadata: {
            revision: policy.revision,
            googleEnabled,
            oidcConnectionIds,
            samlConnectionIds,
            ssoMode,
            ssoMaxAgeSeconds,
          },
        });
        yield* notify(
          resolved.organization,
          enabling
            ? "sso-required"
            : ssoMode !== resolved.policy.ssoMode
              ? "sso-optional"
              : "sso-policy-updated",
          `policy-${policy.revision}`,
        );
        return organizationAuthPolicyView(policy, oidcConnectionIds, samlConnectionIds);
      }),
    );
  });
  return { methods, update, readiness };
});
