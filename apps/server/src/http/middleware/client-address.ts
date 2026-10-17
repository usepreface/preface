import { Option, Result } from "effect";
import type { HttpServerRequest } from "effect/http/HttpServerRequest";
import { IpNetwork, NetAddress } from "effect/net";

// Walk from the socket toward the client; stop at the first untrusted hop.
export const clientAddress = (
  request: HttpServerRequest,
  trustedNetworks: ReadonlyArray<IpNetwork.IpNetwork>,
): string => {
  const socket = Option.getOrUndefined(request.remoteAddress);
  if (socket === undefined) return "unknown";
  const parsed = NetAddress.ipFromString(socket);
  if (Result.isFailure(parsed)) return "unknown";
  let address = NetAddress.toCanonical(parsed.success);
  const forwarded = request.headers["x-forwarded-for"];
  if (forwarded === undefined) return NetAddress.formatIp(address);

  for (const hop of forwarded.split(",").toReversed()) {
    if (!trustedNetworks.some((network) => IpNetwork.contains(network, address))) break;
    const parsedHop = NetAddress.ipFromString(hop.trim());
    // Malformed trusted-proxy input fails closed into one shared limiter bucket.
    if (Result.isFailure(parsedHop)) return "unknown";
    address = NetAddress.toCanonical(parsedHop.success);
  }
  return NetAddress.formatIp(address);
};
