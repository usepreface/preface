import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";

import { Context, Layer } from "effect";

import { IdentityError } from "@usepreface/protocol";
import type { CustomFetch } from "openid-client";

export class OidcHttp extends Context.Service<
  OidcHttp,
  {
    readonly checkUrl: (url: string) => Promise<void>;
    readonly fetch: CustomFetch;
  }
>()("@usepreface/application/node/OidcHttp") {}

const denied = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  denied.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
denied.addSubnet("2001::", 23, "ipv6");
denied.addSubnet("2001:db8::", 32, "ipv6");
denied.addSubnet("2002::", 16, "ipv6");
export const isPublicOidcAddress = (address: string) => {
  const family = isIP(address);
  if (family === 4) return !denied.check(address, "ipv4");
  return family === 6 && globalV6.check(address, "ipv6") && !denied.check(address, "ipv6");
};

export const NodeOidcHttp = {
  layer: (allowedPrivateOrigins: readonly string[] = []) =>
    Layer.sync(OidcHttp, () => {
      const allowed = new Set(allowedPrivateOrigins);
      const resolve = async (value: string) => {
        const url = new URL(value);
        if (url.protocol !== "https:" || url.username || url.password || url.hash)
          throw new IdentityError({ code: "UNSAFE_PROVIDER_URL" });
        const hostname = url.hostname.replace(/^\[|\]$/g, "");
        const addresses = isIP(hostname)
          ? [{ address: hostname, family: isIP(hostname) }]
          : await lookup(hostname, { all: true, verbatim: true }).catch((cause: unknown) => {
              throw new TypeError("OIDC DNS lookup failed", { cause });
            });
        if (
          addresses[0] === undefined ||
          (!allowed.has(url.origin) &&
            addresses.some(({ address }) => !isPublicOidcAddress(address)))
        )
          throw new IdentityError({ code: "UNSAFE_PROVIDER_URL" });
        return { url, addresses };
      };
      return OidcHttp.of({
        checkUrl: async (url) => {
          await resolve(url);
        },
        fetch: async (input, options) => {
          const { url, addresses } = await resolve(String(input));
          return await new Promise<Response>((resolveResponse, reject) => {
            // A fresh socket uses only vetted IPs (including dual-stack fallback); TLS verifies the hostname.
            const outgoing = request(
              url,
              {
                method: options?.method ?? "GET",
                headers: Object.fromEntries(new Headers(options?.headers).entries()),
                agent: false,
                lookup: (_hostname, lookupOptions, callback) => {
                  if (lookupOptions.all) callback(null, addresses);
                  else {
                    const address = addresses[0];
                    if (address === undefined)
                      return callback(new Error("OIDC DNS result is empty"), "");
                    callback(null, address.address, address.family);
                  }
                },
                signal: options?.signal ?? undefined,
                timeout: 10_000,
              },
              (incoming) => {
                const chunks: Buffer[] = [];
                let length = 0;
                incoming.on("data", (chunk: Buffer) => {
                  length += chunk.length;
                  if (length > 256 * 1024) {
                    incoming.destroy(new Error("OIDC response exceeds limit"));
                    outgoing.destroy();
                    reject(new IdentityError({ code: "INVALID_CONFIGURATION" }));
                  } else chunks.push(chunk);
                });
                incoming.on("error", (cause) =>
                  reject(new TypeError("OIDC response failed", { cause })),
                );
                incoming.on("end", () => {
                  const headers = new Headers();
                  for (const [key, value] of Object.entries(incoming.headers)) {
                    if (value !== undefined)
                      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
                  }
                  const status = incoming.statusCode ?? 502;
                  // Redirects are never followed, particularly on credential-bearing requests.
                  if (status >= 300 && status < 400)
                    return reject(new IdentityError({ code: "UNSAFE_PROVIDER_URL" }));
                  resolveResponse(
                    new Response(status === 204 || status === 304 ? null : Buffer.concat(chunks), {
                      status,
                      headers,
                    }),
                  );
                });
              },
            );
            outgoing.on("error", (cause) =>
              reject(new TypeError("OIDC network request failed", { cause })),
            );
            outgoing.on("timeout", () => outgoing.destroy(new Error("OIDC request timed out")));
            const body = options?.body;
            if (body === undefined || body === null) outgoing.end();
            else if (typeof body === "string" || body instanceof URLSearchParams)
              outgoing.end(body.toString());
            else {
              outgoing.destroy();
              reject(new IdentityError({ code: "INVALID_CONFIGURATION" }));
            }
          });
        },
      });
    }),
};
