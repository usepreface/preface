import config from "klarity/oxlint";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [config],
  ignorePatterns: [...config.ignorePatterns, "research/**", "**/routeTree.gen.ts"],
});
