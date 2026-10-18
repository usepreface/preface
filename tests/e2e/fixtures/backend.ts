import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { request as proxyRequest } from "node:http";
import { createServer, type Server } from "node:https";
import { createServer as createReservation } from "node:net";
import { setTimeout } from "node:timers/promises";

import { dashboardHandler } from "./dashboard.js";
import type { Infrastructure } from "./infrastructure.js";

async function listen(server: Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Expected loopback address");
  return `https://localhost:${address.port}`;
}

async function closeServer(server: Server) {
  const closed = new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  server.closeAllConnections();
  await closed;
}

export async function startBackend(infra: Infrastructure, database: string, dashboardUI = false) {
  const resources = new AsyncDisposableStack();
  try {
    const reservation = createReservation();
    reservation.listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const address = reservation.address();
    if (address === null || typeof address === "string")
      throw new Error("Expected loopback address");
    const port = address.port;
    await new Promise<void>((resolve) => reservation.close(() => resolve()));
    const api = createServer(infra.tls, (incoming, outgoing) => {
      const upstream = proxyRequest(
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
    });
    const origin = await listen(api);
    resources.defer(() => closeServer(api));
    // Test destination only. Browser fetches use the real API, CORS and HttpOnly cookies.
    const frontend = createServer(
      infra.tls,
      dashboardUI
        ? dashboardHandler(port)
        : (_incoming, outgoing) => {
            outgoing.writeHead(200, { "content-type": "text/html", "cache-control": "no-store" });
            outgoing.end(
              "<!doctype html><title>Preface auth fixture</title><h1>Authentication destination</h1>",
            );
          },
    );
    const dashboard = await listen(frontend);
    resources.defer(() => closeServer(frontend));
    const child = spawn(process.execPath, ["dist/main.js", "serve", "--log-level", "info"], {
      cwd: new URL("../../../apps/server/", import.meta.url),
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        NODE_ENV: "test",
        NO_COLOR: "1",
        NODE_EXTRA_CA_CERTS: infra.tls.certificatePath,
        CRYPTO_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
        CRYPTO_HMAC_KEY: randomBytes(32).toString("base64"),
        SERVER_HOST: "127.0.0.1",
        SERVER_PORT: String(port),
        PUBLIC_URL: origin,
        DASHBOARD_URL: dashboard,
        POSTGRES_HOST: "127.0.0.1",
        POSTGRES_PORT: String(infra.postgres.getPort()),
        POSTGRES_DATABASE: database,
        POSTGRES_USERNAME: infra.postgres.getUsername(),
        POSTGRES_PASSWORD: infra.postgres.getPassword(),
        POSTGRES_SSL: "false",
        OIDC_ALLOWED_PRIVATE_ORIGINS: infra.idpOrigin,
        EMAIL_PROVIDER: "smtp",
        EMAIL_FROM: "Preface <preface@example.test>",
        SMTP_HOST: "localhost",
        SMTP_PORT: String(infra.mailpit.getMappedPort(1025)),
        SMTP_SECURE: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      output += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      output += chunk;
    });
    const exited = once(child, "exit");
    resources.defer(async () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill("SIGTERM");
      const forced = globalThis.setTimeout(() => child.kill("SIGKILL"), 5000);
      try {
        await exited;
      } finally {
        clearTimeout(forced);
      }
    });
    const deadline = Date.now() + 20_000;
    while (true) {
      if (child.exitCode !== null || Date.now() > deadline)
        throw new Error(`Backend startup failed:\n${output}`);
      try {
        // oxlint-disable-next-line no-await-in-loop -- Bounded startup readiness.
        const response = await fetch(`http://127.0.0.1:${port}/health/ready`, {
          signal: AbortSignal.timeout(500),
        });
        if (response.ok) break;
      } catch {
        /* The listener opens after migrations and bootstrap preparation. */
      }
      // oxlint-disable-next-line no-await-in-loop -- Bounded startup readiness.
      await setTimeout(50);
    }
    const setupUrl = output
      .split("\n")
      .find((line) => line.startsWith(dashboard) && line.includes("/setup#token="));
    if (setupUrl === undefined)
      throw new Error("Missing operator setup link from built server startup");
    return {
      origin,
      dashboard,
      token: new URLSearchParams(new URL(setupUrl.trim()).hash.slice(1)).get("token") ?? "",
      get output() {
        return output;
      },
      close: () => resources.disposeAsync(),
    };
  } catch (error) {
    await resources.disposeAsync();
    throw error;
  }
}
export type Backend = Awaited<ReturnType<typeof startBackend>>;
