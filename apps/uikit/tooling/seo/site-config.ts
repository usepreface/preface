import type { SiteConfig } from "../../src/seo/metadata.js";

export function siteConfig(
  env: Readonly<Record<string, string | undefined>>,
  building: boolean,
): SiteConfig {
  const domain = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  const production = (env.VERCEL_TARGET_ENV ?? env.VERCEL_ENV) === "production";

  if (building && production && !domain) {
    throw new Error(
      "Production SEO requires Vercel system environment variables. Enable them in the Vercel project settings.",
    );
  }

  return {
    origin: domain ? new URL(`https://${domain}`).origin : undefined,
    indexable: building && production && Boolean(domain),
  };
}
