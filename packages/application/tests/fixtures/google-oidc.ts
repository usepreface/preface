import { generateKeyPairSync } from "node:crypto";

import { signedIdToken } from "./signed-id-token.js";

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
    return Response.json({
      token_type: "Bearer",
      access_token: "fixture-access-token",
      expires_in: 300,
      id_token: signedIdToken(this.keys.privateKey, this.claims, this.tamperSignature),
    });
  };
}
