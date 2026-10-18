import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { prepareDevelopmentEnvironment } from "../../../tooling/development/environment.ts";

const template = fileURLToPath(new URL("../../../apps/server/.env.example", import.meta.url));

test("development restarts preserve encryption keys and local TLS identity", async (context) => {
  const repository = await mkdtemp(join(tmpdir(), "preface-development-"));
  context.after(() => rm(repository, { recursive: true, force: true }));
  await mkdir(join(repository, "apps/server"), { recursive: true });
  await copyFile(template, join(repository, "apps/server/.env.example"));

  await prepareDevelopmentEnvironment(repository);
  const environment = await readFile(join(repository, ".local/development/server.env"), "utf8");
  const privateKey = await readFile(join(repository, ".local/development/keycloak/private.key"));
  const certificate = await readFile(
    join(repository, ".local/development/keycloak/certificate.pem"),
  );

  await prepareDevelopmentEnvironment(repository);

  assert.equal(
    await readFile(join(repository, ".local/development/server.env"), "utf8"),
    environment,
  );
  assert.deepEqual(
    await readFile(join(repository, ".local/development/keycloak/private.key")),
    privateKey,
  );
  assert.deepEqual(
    await readFile(join(repository, ".local/development/keycloak/certificate.pem")),
    certificate,
  );
});

test("development defaults leave an existing server environment untouched", async (context) => {
  const repository = await mkdtemp(join(tmpdir(), "preface-development-"));
  context.after(() => rm(repository, { recursive: true, force: true }));
  await mkdir(join(repository, "apps/server"), { recursive: true });
  await copyFile(template, join(repository, "apps/server/.env.example"));
  const overrides = "EMAIL_PROVIDER=development\nSERVER_PORT=8099\n";
  await writeFile(join(repository, "apps/server/.env"), overrides);

  await prepareDevelopmentEnvironment(repository);

  assert.equal(await readFile(join(repository, "apps/server/.env"), "utf8"), overrides);
});
