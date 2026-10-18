import { readFile } from "node:fs/promises";
import { request } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../apps/dashboard/dist/", import.meta.url));
const contentTypes: Readonly<Record<string, string>> = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".html": "text/html",
};

// Exercise the built SPA and real backend through the same origin used in deployment.
export function dashboardHandler(port: number) {
  return (incoming: IncomingMessage, outgoing: ServerResponse) => {
    if (incoming.url?.startsWith("/api/")) {
      const upstream = request(
        {
          hostname: "127.0.0.1",
          port,
          path: incoming.url,
          method: incoming.method,
          headers: incoming.headers,
        },
        (response) => {
          outgoing.writeHead(response.statusCode ?? 502, response.headers);
          response.pipe(outgoing);
        },
      );
      upstream.on("error", () => {
        outgoing.writeHead(502);
        outgoing.end();
      });
      incoming.pipe(upstream);
      return;
    }
    void serveAsset(incoming, outgoing);
  };
}

async function serveAsset(incoming: IncomingMessage, outgoing: ServerResponse) {
  try {
    const pathname = new URL(incoming.url ?? "/", "https://localhost").pathname;
    const asset = extname(pathname) ? resolve(root, `.${pathname}`) : resolve(root, "index.html");
    if (!asset.startsWith(root)) {
      outgoing.writeHead(404);
      outgoing.end();
      return;
    }
    const content = await readFile(asset);
    outgoing.writeHead(200, {
      "content-type": contentTypes[extname(asset)] ?? "application/octet-stream",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    });
    outgoing.end(content);
  } catch {
    outgoing.writeHead(404);
    outgoing.end();
  }
}
