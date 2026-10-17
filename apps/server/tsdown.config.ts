import { fileURLToPath } from "node:url";

import defineConfig from "klarity/tsdown/node";
import type { UserConfig } from "tsdown";

export default defineConfig({
  alias: { "#": fileURLToPath(new URL("./src", import.meta.url)) },
  entry: { main: "src/main.ts" },
  exports: false,
  target: "node24",
  unbundle: true,
}) as UserConfig;
