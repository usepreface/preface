import { Schema } from "effect";
import { OpenApi } from "effect/http-api";

import { RequestBootstrapVerificationRequest } from "@usepreface/protocol/dto";
import { RequestBootstrapVerificationInput } from "@usepreface/protocol/input";
import { describe, expect, it } from "vitest";

import { PrefaceApi } from "../../src/index.js";

describe("public HTTP contract", () => {
  it("describes browser authentication transports, protected routes and status-specific setup errors", () => {
    const spec = OpenApi.fromApi(PrefaceApi);

    expect(Object.keys(spec.paths).every((path) => path.startsWith("/api/v1/"))).toBe(true);
    expect(spec.paths["/api/v1/auth/oidc/callback"]?.get?.responses).toHaveProperty("303");
    expect(spec.paths["/api/v1/auth/saml/complete"]?.get?.responses).toHaveProperty("303");

    const assertionConsumer = spec.paths["/api/v1/auth/saml/{connectionId}/acs"]?.post;
    expect(assertionConsumer?.responses).toHaveProperty("303");
    expect(assertionConsumer?.requestBody).toMatchObject({
      content: { "application/x-www-form-urlencoded": expect.any(Object) },
    });

    expect(
      spec.paths["/api/v1/auth/external/flows/{flowId}/email/verify"]?.post?.responses,
    ).toHaveProperty("200");
    expect(
      spec.paths["/api/v1/organizations/{organizationId}/auth-policy"]?.patch?.security,
    ).toEqual([{ session: [] }]);
    expect(
      spec.paths["/api/v1/organizations/{organizationId}/audit-events"]?.get?.security,
    ).toEqual([{ session: [] }]);

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
