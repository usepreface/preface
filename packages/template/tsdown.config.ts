import defineConfig from "klarity/tsdown/library";
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
  unbundle: true,
}) as UserConfig;
