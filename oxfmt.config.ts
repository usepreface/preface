import config from "klarity/oxfmt";

export default {
  ...config,
  ignorePatterns: [...config.ignorePatterns, "research/**", "**/routeTree.gen.ts"],
};
