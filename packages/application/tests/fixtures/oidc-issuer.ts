import { generateKeyPairSync, sign } from "node:crypto";

import type { CustomFetch } from "openid-client";

// Only HTTP is substituted. The production adapter and openid-client validate the signed tokens.
export class OidcIssuerFixture {
  readonly issuer = "https://identity.example.test";
  readonly keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  claims: Record<string, unknown> = {
    iss: this.issuer,
    aud: "preface-client",
    sub: "employee-42",
    nonce: "expected-nonce",
    email: "provider@example.test",
    email_verified: true,
  };
  metadata = {
    issuer: this.issuer,
    authorization_endpoint: `${this.issuer}/authorize`,
    token_endpoint: `${this.issuer}/token`,
    jwks_uri: `${this.issuer}/jwks`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    code_challenge_methods_supported: ["S256"],
  };
  tokenParameters: URLSearchParams | undefined;
  tokenAuthorization: string | null = null;
  tamperSignature = false;
  fetch: CustomFetch = async (input, options) => {
    const url = String(input);
    if (url === `${this.issuer}/.well-known/openid-configuration`)
      return Response.json(this.metadata);
    if (url === `${this.issuer}/jwks`)
      return Response.json({
        keys: [
          {
            ...this.keys.publicKey.export({ format: "jwk" }),
            kid: "fixture-key",
            alg: "RS256",
            use: "sig",
          },
        ],
      });
    if (url !== `${this.issuer}/token`) throw new Error("Unexpected OIDC destination");
    this.tokenParameters = new URLSearchParams(String(options?.body));
    this.tokenAuthorization = new Headers(options?.headers).get("authorization");
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "fixture-key" })).toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({ iat: now, exp: now + 300, ...this.claims }),
    ).toString("base64url");
    const signature = sign(
      "RSA-SHA256",
      Buffer.from(`${header}.${payload}`),
      this.keys.privateKey,
    ).toString("base64url");
    return Response.json({
      token_type: "Bearer",
      access_token: "fixture-access-token",
      expires_in: 300,
      id_token: `${header}.${payload}.${this.tamperSignature ? "A".repeat(signature.length) : signature}`,
    });
  };
}
