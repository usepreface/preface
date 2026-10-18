import { sign, type KeyObject } from "node:crypto";

export const signedIdToken = (
  privateKey: KeyObject,
  claims: Readonly<Record<string, unknown>>,
  tamperSignature: boolean,
) => {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "fixture-key" })).toString(
    "base64url",
  );
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, ...claims })).toString(
    "base64url",
  );
  const signature = sign("RSA-SHA256", Buffer.from(`${header}.${payload}`), privateKey).toString(
    "base64url",
  );

  return `${header}.${payload}.${tamperSignature ? "A".repeat(signature.length) : signature}`;
};
