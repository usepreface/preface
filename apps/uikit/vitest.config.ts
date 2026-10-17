import defineNodeVitestConfig from "klarity/vitest/node";

export default defineNodeVitestConfig({
  test: { include: ["tests/**/*.test.ts"] },
});
