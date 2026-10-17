import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";

export const serverDirectory = fileURLToPath(new URL("../..", import.meta.url));

export async function availablePort() {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const address = reservation.address();
  if (address === null || typeof address === "string") throw new Error("Expected a TCP address");
  const port = address.port;
  await new Promise((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

export function testEnvironment(databasePort, serverPort) {
  // Never inherit database/SSL or source-resolution settings from the developer's environment.
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: "development",
    EMAIL_PROVIDER: "development",
    EMAIL_FROM: "Preface <preface@example.test>",
    CRYPTO_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    CRYPTO_HMAC_KEY: Buffer.alloc(32, 8).toString("base64"),
    PUBLIC_URL: `http://localhost:${serverPort}`,
    SERVER_HOST: "127.0.0.1",
    SERVER_PORT: String(serverPort),
    POSTGRES_HOST: "127.0.0.1",
    POSTGRES_PORT: String(databasePort),
    POSTGRES_DATABASE: "preface_test",
    POSTGRES_USERNAME: "preface_test",
    POSTGRES_PASSWORD: "unused-by-disposable-trust-database",
    POSTGRES_SSL: "false",
    NO_COLOR: "1",
  };
}

export function spawnBackend(env) {
  const child = spawn(process.execPath, ["dist/main.js", "serve", "--log-level", "info"], {
    cwd: serverDirectory,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.setEncoding("utf8").on("data", (chunk) => {
    stderr += chunk;
  });
  const exited = once(child, "exit");

  return {
    child,
    exited,
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
    async close() {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill("SIGTERM");
      const forced = globalThis.setTimeout(() => child.kill("SIGKILL"), 5000);
      try {
        await exited;
      } finally {
        clearTimeout(forced);
      }
    },
  };
}

export async function waitForReadiness(port, running) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (running.child.exitCode !== null) throw new Error("Server exited before readiness");
    try {
      // oxlint-disable-next-line no-await-in-loop -- Readiness probes must finish before retrying.
      const response = await fetch(`http://127.0.0.1:${port}/health/ready`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return;
    } catch {
      // The listener is intentionally absent until startup has completed.
    }
    // oxlint-disable-next-line no-await-in-loop -- Bound the retry rate while startup is pending.
    await setTimeout(25);
  }
  throw new Error("Server did not become ready");
}

export function setupLink(output) {
  const line = output
    .split("\n")
    .find((value) => value.startsWith("http://localhost:") && value.includes("/setup#token="));
  if (line === undefined) throw new Error("Expected the one-time operator setup URL");
  return new URL(line.trim());
}

export async function waitForDevelopmentCode(running, outputOffset = 0) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const code = running.stdout
      .slice(outputOffset)
      .match(/email\.development[\s\S]*?\b(\d{8})\b/)?.[1];
    if (code !== undefined) return code;
    // oxlint-disable-next-line no-await-in-loop -- Wait for the worker's explicit development output.
    await setTimeout(25);
  }
  throw new Error("Expected a rendered code from the development worker");
}
