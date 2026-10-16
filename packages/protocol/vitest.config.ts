import { fileURLToPath } from "node:url";

import defineNodeVitestConfig from "klarity/vitest/node";

export default defineNodeVitestConfig({
  resolve: {
    alias: { "#": fileURLToPath(new URL("./src", import.meta.url)) },
    conditions: ["preface-source"],
  },
  test: { include: ["tests/**/*.test.ts"] },
});
