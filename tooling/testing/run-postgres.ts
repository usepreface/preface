import { spawn } from "node:child_process";

import { startPostgres } from "./postgres.ts";

const postgres = await startPostgres();
try {
  const env = {
    ...process.env,
    PREFACE_TEST_POSTGRES_PORT: String(postgres.getPort()),
    PREFACE_TEST_POSTGRES_PASSWORD: postgres.getPassword(),
  };

  // Each package resets the same disposable database. Keep package suites sequential.
  for (const [name, script] of [
    ["database", "test"],
    ["emails", "test"],
    ["application", "test"],
    ["server", "test"],
    ["database", "test:built"],
    ["application", "test:built"],
    ["server", "test:built"],
  ] as const) {
    // oxlint-disable-next-line no-await-in-loop -- Suites share a destructive test database.
    const code = await new Promise<number>((resolve, reject) => {
      const child = spawn("pnpm", ["--filter", `@usepreface/${name}`, script], {
        env,
        stdio: "inherit",
      });
      const interrupt = () => child.kill("SIGTERM");
      process.once("SIGTERM", interrupt);
      process.once("SIGINT", interrupt);
      child.once("error", reject);
      child.once("exit", (status) => {
        process.removeListener("SIGTERM", interrupt);
        process.removeListener("SIGINT", interrupt);
        resolve(status ?? 1);
      });
    });
    if (code !== 0) {
      process.exitCode = code;
      break;
    }
  }
} finally {
  await postgres.stop();
}
