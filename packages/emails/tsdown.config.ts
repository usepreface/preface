import { fileURLToPath } from "node:url";

import defineConfig from "klarity/tsdown/node";
import type { UserConfig } from "tsdown";

export default defineConfig({
  alias: { "#": fileURLToPath(new URL("./src", import.meta.url)) },
  entry: {
    index: "src/index.ts",
    "node/index": "src/node/index.ts",
    "testing/index": "src/testing/index.ts",
  },
  exports: { devExports: "preface-source" },
  publint: "ci-only",
  target: "node24",
  unbundle: true,
}) as UserConfig;
