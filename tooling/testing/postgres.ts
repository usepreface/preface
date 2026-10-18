import { randomBytes } from "node:crypto";

import { PostgreSqlContainer } from "@testcontainers/postgresql";

/** Dedicated credentials and random loopback port; never reads deployment configuration. */
export async function startPostgres() {
  const container = await new PostgreSqlContainer("postgres:17.9-alpine")
    .withUsername("preface_test")
    .withDatabase("preface_test")
    .withPassword(randomBytes(24).toString("hex"))
    .withStartupTimeout(90_000)
    .start();

  if (!["localhost", "127.0.0.1"].includes(container.getHost())) {
    await container.stop();
    throw new Error("Destructive PostgreSQL tests require a local Docker runtime");
  }

  return container;
}
