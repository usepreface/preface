import { Schema } from "effect";
import { OpenApi } from "effect/http-api";

import { RequestBootstrapVerificationRequest } from "@usepreface/protocol/dto";
import { RequestBootstrapVerificationInput } from "@usepreface/protocol/input";
import { describe, expect, it } from "vitest";

import { PrefaceApi } from "../../src/index.js";

describe("public HTTP contract", () => {
  it("describes the versioned routes, cookie authentication and status-specific setup errors", () => {
    const spec = OpenApi.fromApi(PrefaceApi);

    expect(Object.keys(spec.paths)).toEqual([
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/sign-in/start",
      "/api/v1/auth/oidc/callback",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/saml/metadata",
      "/api/v1/auth/saml/{connectionId}/acs",
      "/api/v1/auth/saml/complete",
      "/api/v1/organizations/{organizationId}/identity-connections",
      "/api/v1/organizations/{organizationId}/identity-connections/saml",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/saml",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/saml/rotate-signing-key",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/test",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/activate",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/disable",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/refresh-metadata",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/link/start",
      "/api/v1/organizations/{organizationId}/identity-connections/{connectionId}/reauthenticate/start",
      "/api/v1/auth/methods",
      "/api/v1/auth/google/start",
      "/api/v1/auth/google/callback",
      "/api/v1/instance/authentication/google",
      "/api/v1/instance/authentication/google/test",
      "/api/v1/instance/authentication/google/activate",
      "/api/v1/instance/authentication/google/disable",
      "/api/v1/users/me/accounts",
      "/api/v1/users/me/accounts/google/start",
      "/api/v1/users/me/accounts/{accountId}",
      "/api/v1/auth/reauthentication/email/request",
      "/api/v1/auth/reauthentication/email/resend",
      "/api/v1/auth/reauthentication/email/verify",
      "/api/v1/auth/reauthentication/google/start",
      "/api/v1/organizations/{organizationId}/authentication/methods",
      "/api/v1/organizations/{organizationId}/auth-policy/readiness",
      "/api/v1/organizations/{organizationId}/auth-policy",
      "/api/v1/organizations/{organizationId}/auth-recovery",
      "/api/v1/organizations/{organizationId}/auth-recovery/rotate",
      "/api/v1/organizations/{organizationId}/auth-recovery/recover",
      "/api/v1/organizations/{organizationId}/teams",
      "/api/v1/organizations/{organizationId}/teams/{teamId}",
      "/api/v1/organizations/{organizationId}/teams/{teamId}/archive",
      "/api/v1/organizations/{organizationId}/teams/{teamId}/access",
      "/api/v1/organizations/{organizationId}/teams/{teamId}/roles",
      "/api/v1/organizations/{organizationId}/teams/{teamId}/members",
      "/api/v1/organizations/{organizationId}/teams/{teamId}/members/{memberId}",
      "/api/v1/users/me",
      "/api/v1/instance/setup",
      "/api/v1/instance/setup/inspect",
      "/api/v1/instance/setup/resend",
      "/api/v1/instance/setup/verify",
      "/api/v1/auth/session",
      "/api/v1/auth/email/request",
      "/api/v1/auth/email/resend",
      "/api/v1/auth/email/verify",
      "/api/v1/invitations/inspect",
      "/api/v1/invitations/verification/request",
      "/api/v1/invitations/accept",
      "/api/v1/organizations/{organizationId}/invitations",
      "/api/v1/organizations/{organizationId}/invitations/{invitationId}/resend",
      "/api/v1/organizations/{organizationId}/invitations/{invitationId}",
      "/api/v1/auth/sessions",
      "/api/v1/auth/sessions/{sessionId}",
      "/api/v1/organizations",
      "/api/v1/organizations/{organizationId}",
      "/api/v1/organizations/{organizationId}/access",
      "/api/v1/organizations/{organizationId}/archive",
      "/api/v1/organizations/{organizationId}/restore",
      "/api/v1/organizations/{organizationId}/members",
      "/api/v1/organizations/{organizationId}/members/{memberId}/suspend",
      "/api/v1/organizations/{organizationId}/members/{memberId}/reinstate",
      "/api/v1/organizations/{organizationId}/members/{memberId}",
      "/api/v1/organizations/{organizationId}/leave",
      "/api/v1/organizations/{organizationId}/roles",
      "/api/v1/organizations/{organizationId}/roles/{roleId}",
      "/api/v1/organizations/{organizationId}/role-bindings",
      "/api/v1/organizations/{organizationId}/role-bindings/{bindingId}",
      "/api/v1/organizations/{organizationId}/owners/{memberId}",
      "/api/v1/organizations/{organizationId}/ownership/transfer",
      "/api/v1/instance/capabilities",
    ]);
    expect(spec.paths["/api/v1/auth/session"]?.get?.security).toEqual([{ session: [] }]);
    expect(spec.components?.securitySchemes?.session).toEqual({
      type: "apiKey",
      in: "cookie",
      name: "preface_session",
    });
    expect(spec.paths["/api/v1/instance/setup"]?.post?.responses).toHaveProperty("202");
    expect(spec.paths["/api/v1/instance/setup"]?.post?.responses).toHaveProperty("409");
    expect(spec.components?.schemas?.RequestBootstrapVerificationRequest).toMatchObject({
      properties: {
        token: { writeOnly: true },
      },
    });
    expect(JSON.stringify(spec.paths["/api/v1/instance/setup"]?.post?.responses)).not.toContain(
      "passwordHash",
    );
    expect(JSON.stringify(spec)).not.toContain("reissue");
  });

  it("encodes a client request while preserving the non-encodable application input", () => {
    const request = {
      token: "example-setup-proof",
      instanceName: " Knowledge ",
      ownerName: " Owner ",
      email: " Owner@Example.Test ",
    };
    const encoded = Schema.encodeSync(RequestBootstrapVerificationRequest)(request);
    const input = Schema.decodeUnknownSync(RequestBootstrapVerificationInput)(encoded);

    expect(encoded).toEqual(request);
    expect(input).toMatchObject({
      instanceName: "Knowledge",
      ownerName: "Owner",
      email: "owner@example.test",
    });
    expect(() => Schema.encodeSync(RequestBootstrapVerificationInput)(input)).toThrow();
    expect(JSON.stringify(input)).not.toContain(request.token);
  });
});
