import type { HttpServerRequest } from "effect/http/HttpServerRequest";

export const permitsMutation = (
  request: HttpServerRequest,
  allowedOrigins: ReadonlySet<string>,
) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.origin;
  if (origin === undefined || !allowedOrigins.has(origin)) return false;

  // An explicitly allowed cross-origin development client remains supported.
  // The exact Origin allowlist is authoritative; sibling domains aren't implicitly trusted.
  const site = request.headers["sec-fetch-site"];
  return site === undefined || ["same-origin", "same-site", "cross-site", "none"].includes(site);
};
