import { fileURLToPath } from "node:url";

import defineNodeVitestConfig from "klarity/vitest/node";

export default defineNodeVitestConfig({
  resolve: {
    alias: { "#": fileURLToPath(new URL("./src", import.meta.url)) },
    conditions: ["preface-source"],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    maxWorkers: 2,
    fileParallelism: process.env.PREFACE_TEST_POSTGRES_PORT === undefined,
    hookTimeout: 30_000,
    testTimeout: 30_000,
    env: { TZ: "UTC" },
  },
});
