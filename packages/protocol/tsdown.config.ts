import { fileURLToPath } from "node:url";

import defineConfig from "klarity/tsdown/library";
import type { UserConfig } from "tsdown";

export default defineConfig({
  alias: {
    "#": fileURLToPath(new URL("./src", import.meta.url)),
  },
  entry: {
    index: "src/index.ts",
    "model/index": "src/model/index.ts",
    "dto/index": "src/dto/index.ts",
    "input/index": "src/input/index.ts",
  },
  exports: {
    devExports: "preface-source",
  },
  publint: "ci-only",
  unbundle: true,
}) as UserConfig;
