import { inflateRawSync } from "node:zlib";

export const readSamlStart = (authorizationUrl: string) => {
  const url = new URL(authorizationUrl);
  const encoded = url.searchParams.get("SAMLRequest");
  const relayState = url.searchParams.get("RelayState");
  if (encoded === null || relayState === null) throw new Error("Expected SAML authorization URL");
  const request = inflateRawSync(Buffer.from(encoded, "base64")).toString("utf8");
  const requestId = /ID="([^"]+)"/.exec(request)?.[1];
  if (requestId === undefined) throw new Error("Expected signed AuthnRequest");
  return { requestId, relayState };
};
