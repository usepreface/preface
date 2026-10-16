import defineConfig from "klarity/tsdown/node";
import type { UserConfig } from "tsdown";

export default defineConfig({
  alias: {
    "#/": "./src/",
  },
  entry: {
    index: "src/index.ts",
  },
  exports: {
    devExports: "preface-source",
  },
  publint: "ci-only",
  target: "node24",
  unbundle: true,
}) as UserConfig;
