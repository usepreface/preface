import { fileURLToPath } from "node:url";

import defineConfig from "klarity/tsdown/node";
import type { UserConfig } from "tsdown";

export default defineConfig({
  alias: {
    "#": fileURLToPath(new URL("./src", import.meta.url)),
  },
  entry: {
    index: "src/index.ts",
    "testing/index": "src/testing/index.ts",
    "migrations/run": "src/migrations/run.ts",
  },
  deps: {
    neverBundle: [/^@effect\//, "@electric-sql/pglite"],
  },
  exports: {
    devExports: "preface-source",
    exclude: ["migrations/run"],
  },
  publint: "ci-only",
  target: "node24",
  unbundle: true,
}) as UserConfig;
