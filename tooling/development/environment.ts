import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

export async function prepareDevelopmentEnvironment(repository: string) {
  const directory = join(repository, ".local/development");
  const tlsDirectory = join(directory, "keycloak");
  const certificate = join(tlsDirectory, "certificate.pem");
  const privateKey = join(tlsDirectory, "private.key");
  const environment = join(directory, "server.env");

  await mkdir(tlsDirectory, { recursive: true });
  await chmod(tlsDirectory, 0o755);

  if (existsSync(certificate) !== existsSync(privateKey)) {
    throw new Error(
      "Incomplete development TLS files. Remove .local/development/keycloak and run pnpm services:up again.",
    );
  }

  if (!existsSync(certificate)) {
    await promisify(execFile)("openssl", [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-days",
      "3650",
      "-keyout",
      privateKey,
      "-out",
      certificate,
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
      "-addext",
      "basicConstraints=critical,CA:TRUE",
    ]);
    // Keycloak's unprivileged container user must read this local-only TLS key.
    await chmod(privateKey, 0o644);
    await chmod(certificate, 0o644);
  }

  if (!existsSync(environment)) {
    const template = await readFile(join(repository, "apps/server/.env.example"), "utf8");
    const configured = template
      .replace(
        /^CRYPTO_ENCRYPTION_KEY=$/m,
        `CRYPTO_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`,
      )
      .replace(/^CRYPTO_HMAC_KEY=$/m, `CRYPTO_HMAC_KEY=${randomBytes(32).toString("base64")}`);

    // Do not rewrite keys on restart or change the developer's package-local overrides.
    await writeFile(
      environment,
      `# Generated development defaults; retained across restarts.\n# Put overrides in apps/server/.env.\n${configured}`,
      { flag: "wx", mode: 0o600 },
    );
  }
}
