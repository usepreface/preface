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
      "/api/v1/instance/setup",
      "/api/v1/instance/setup/inspect",
      "/api/v1/instance/setup/resend",
      "/api/v1/instance/setup/verify",
      "/api/v1/auth/session",
      "/api/v1/auth/email/request",
      "/api/v1/auth/email/resend",
      "/api/v1/auth/email/verify",
      "/api/v1/auth/sessions",
      "/api/v1/auth/sessions/{sessionId}",
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
