import { Effect, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import {
  InvitationAuthenticationInput,
  type InvitationTokenInput,
} from "@usepreface/protocol/input";

import { makeGoogleFlowStart } from "#/auth/google/start";
import { makeOidcFlowStart } from "#/auth/oidc/start";
import { makeSamlFlowStart } from "#/auth/saml/start";
import { makeInvitationAuthority } from "#/organization/invitation/authority";

export const makeInvitationAuthentication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const authority = yield* makeInvitationAuthority;
  const google = yield* makeGoogleFlowStart;
  const oidc = yield* makeOidcFlowStart;
  const saml = yield* makeSamlFlowStart;
  const methods = Effect.fn("Application.auth.external.invitationMethods")(function* (
    input: InvitationTokenInput,
  ) {
    const { invitation } = yield* authority.requireToken(input);
    yield* authority.requireInviter(invitation);
    const policy = yield* repository.organization.authPolicy.findByOrganizationId(
      invitation.organizationId,
    );
    if (policy === undefined) return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
    const approved = yield* repository.organization.authPolicyConnection.listByOrganization(
      invitation.organizationId,
    );
    const connections = yield* repository.auth.identityConnection.listByOrganization(
      invitation.organizationId,
    );
    const choices: {
      readonly connectionId: (typeof connections)[number]["id"];
      readonly provider: "google" | "oidc" | "saml";
      readonly name: string;
    }[] = connections
      .filter(
        (connection) =>
          connection.status === "active" &&
          approved.some((entry) => entry.identityConnectionId === connection.id),
      )
      .map((connection) => ({
        connectionId: connection.id,
        provider: connection.provider,
        name: connection.name,
      }));
    if (policy.allowedMethods.includes("google") && policy.ssoMode !== "required") {
      const connection = yield* repository.auth.identityConnection.findGoogle();
      if (connection?.status === "active")
        choices.push({ connectionId: connection.id, provider: "google", name: connection.name });
    }
    return { methods: choices, ssoRequired: policy.ssoMode === "required" };
  });
  const start = Effect.fn("Application.auth.external.startInvitation")(function* (
    input: InvitationAuthenticationInput,
    actor?: SessionActor,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(InvitationAuthenticationInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    const { invitation } = yield* authority.requireToken(decoded);
    const available = yield* methods(decoded);
    const choice = available.methods.find((entry) => entry.connectionId === decoded.connectionId);
    if (choice === undefined) return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
    const enrollment = {
      invitationId: invitation.id,
      invitationRevision: invitation.revision,
      targetOrganizationId: invitation.organizationId,
      displayName: decoded.displayName,
    };
    const result =
      choice.provider === "google"
        ? yield* google("accept_invitation", actor, decoded, undefined, enrollment)
        : yield* (choice.provider === "oidc" ? oidc : saml)(
            "accept_invitation",
            invitation.organizationId,
            choice.connectionId,
            decoded,
            actor,
            undefined,
            enrollment,
          );
    return { ...result, provider: choice.provider };
  });
  return { methods, start };
});
