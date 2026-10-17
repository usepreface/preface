import { generateKeyPairSync, sign } from "node:crypto";

// A signed OIDC issuer fixture replaces HTTP only; the production adapter and SDK verify it.
export class GoogleOidcFixture {
  readonly keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  claims: Record<string, unknown> = {
    iss: "https://accounts.google.com",
    aud: "preface-client",
    sub: "google-subject",
    email: "provider@example.test",
    email_verified: true,
    nonce: "expected-nonce",
  };
  tamperSignature = false;
  tokenRequests = 0;
  tokenParameters: URLSearchParams | undefined;
  fetch: typeof fetch = async (input, options) => {
    const url = String(input);
    if (url === "https://www.googleapis.com/oauth2/v3/certs") {
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
    }
    if (url !== "https://oauth2.googleapis.com/token")
      throw new Error("Unexpected external destination");
    this.tokenRequests += 1;
    this.tokenParameters = new URLSearchParams(String(options?.body));
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
