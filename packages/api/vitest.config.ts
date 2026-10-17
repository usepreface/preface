import defineNodeVitestConfig from "klarity/vitest/node";

export default defineNodeVitestConfig({
  // Honor source exports across packages without overriding each package's #/* imports.
  ssr: {
    resolve: { conditions: ["preface-source"], externalConditions: ["preface-source"] },
  },
  resolve: {
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
