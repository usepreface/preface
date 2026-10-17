import type { SiteConfig } from "./seo/metadata.js";

declare global {
  interface ImportMetaEnv {
    readonly UIKIT_SITE: SiteConfig;
  }
}
