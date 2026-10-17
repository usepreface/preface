import { Schema } from "effect";
import { OpenApi } from "effect/http-api";

import { CompleteBootstrapRequest } from "@usepreface/protocol/dto";
import { CompleteBootstrapInput } from "@usepreface/protocol/input";
import { describe, expect, it } from "vitest";

import { PrefaceApi } from "../../src/index.js";

describe("public HTTP contract", () => {
  it("describes the versioned routes, cookie authentication and status-specific setup errors", () => {
    const spec = OpenApi.fromApi(PrefaceApi);

    expect(Object.keys(spec.paths)).toEqual([
      "/api/v1/instance/setup",
      "/api/v1/instance/setup/inspect",
      "/api/v1/auth/session",
    ]);
    expect(spec.paths["/api/v1/auth/session"]?.get?.security).toEqual([{ session: [] }]);
    expect(spec.components?.securitySchemes?.session).toEqual({
      type: "apiKey",
      in: "cookie",
      name: "preface_session",
    });
    expect(spec.paths["/api/v1/instance/setup"]?.post?.responses).toHaveProperty("201");
    expect(spec.paths["/api/v1/instance/setup"]?.post?.responses).toHaveProperty("409");
    // JSON Schema counts Unicode code points; the existing password policy counts UTF-16 units.
    expect(spec.components?.schemas?.CompleteBootstrapRequest).toMatchObject({
      properties: {
        password: { type: "string", minLength: 8, allOf: [{ writeOnly: true }] },
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
      password: "  a long password  ",
    };
    const encoded = Schema.encodeSync(CompleteBootstrapRequest)(request);
    const input = Schema.decodeUnknownSync(CompleteBootstrapInput)(encoded);

    expect(encoded).toEqual(request);
    expect(input).toMatchObject({
      instanceName: "Knowledge",
      ownerName: "Owner",
      email: "owner@example.test",
    });
    expect(() => Schema.encodeSync(CompleteBootstrapInput)(input)).toThrow();
    expect(JSON.stringify(input)).not.toContain(request.password);
    expect(JSON.stringify(input)).not.toContain(request.token);
  });
});
