import { AnthropicLogo } from "./anthropic";
import { Auth0Logo } from "./auth0";
import { AWSLogo } from "./aws";
import { AzureLogo } from "./azure";
import { BlueskyLogo } from "./bluesky";
import { ClaudeLogo } from "./claude";
import { CloudflareLogo } from "./cloudflare";
import { ConfluenceLogo } from "./confluence";
import { CursorLogo } from "./cursor";
import { DiscordLogo } from "./discord";
import { DockerLogo } from "./docker";
import { DropboxLogo } from "./dropbox";
import { FigmaLogo } from "./figma";
import { GeminiLogo } from "./gemini";
import { GitHubLogo } from "./github";
import { GitLabLogo } from "./gitlab";
import { GmailLogo } from "./gmail";
import { GoogleLogo } from "./google";
import { GoogleDocsLogo } from "./google-docs";
import { GoogleDriveLogo } from "./google-drive";
import { HelmLogo } from "./helm";
import { HuggingFaceLogo } from "./hugging-face";
import { InstagramLogo } from "./instagram";
import { IntercomLogo } from "./intercom";
import { JiraLogo } from "./jira";
import { KubernetesLogo } from "./kubernetes";
import { LinearLogo } from "./linear";
import { LinkedInLogo } from "./linkedin";
// Lookup of every logo by thesvg slug. Imports all logos: use the named exports when bundle size matters.
import type { LogoProps } from "./logo-props";
import { MarkdownLogo } from "./markdown";
import { MastodonLogo } from "./mastodon";
import { MediumLogo } from "./medium";
import { MicrosoftLogo } from "./microsoft";
import { MicrosoftOnedriveLogo } from "./microsoft-onedrive";
import { MicrosoftSharepointLogo } from "./microsoft-sharepoint";
import { MicrosoftTeamsLogo } from "./microsoft-teams";
import { MistralLogo } from "./mistral";
import { ModelContextProtocolLogo } from "./model-context-protocol";
import { NextjsLogo } from "./nextjs";
import { NotionLogo } from "./notion";
import { NpmLogo } from "./npm";
import { OktaLogo } from "./okta";
import { OllamaLogo } from "./ollama";
import { OpenAILogo } from "./openai";
import { PDFLogo } from "./pdf";
import { PostgreSQLLogo } from "./postgresql";
import { ProductHuntLogo } from "./product-hunt";
import { PythonLogo } from "./python";
import { ReactLogo } from "./react";
import { RedditLogo } from "./reddit";
import { RedisLogo } from "./redis";
import { RSSLogo } from "./rss";
import { SlackLogo } from "./slack";
import { StripeLogo } from "./stripe";
import { SubstackLogo } from "./substack";
import { SupabaseLogo } from "./supabase";
import { TelegramLogo } from "./telegram";
import { ThreadsLogo } from "./threads";
import { TypeScriptLogo } from "./typescript";
import { VercelLogo } from "./vercel";
import { WhatsAppLogo } from "./whatsapp";
import { XLogo } from "./x";
import { YCombinatorLogo } from "./y-combinator";
import { YouTubeLogo } from "./youtube";
import { ZapierLogo } from "./zapier";
import { ZendeskLogo } from "./zendesk";

export const brandLogos = {
  anthropic: AnthropicLogo,
  auth0: Auth0Logo,
  aws: AWSLogo,
  azure: AzureLogo,
  bluesky: BlueskyLogo,
  claude: ClaudeLogo,
  cloudflare: CloudflareLogo,
  confluence: ConfluenceLogo,
  cursor: CursorLogo,
  discord: DiscordLogo,
  docker: DockerLogo,
  dropbox: DropboxLogo,
  figma: FigmaLogo,
  gemini: GeminiLogo,
  github: GitHubLogo,
  gitlab: GitLabLogo,
  gmail: GmailLogo,
  google: GoogleLogo,
  "google-docs": GoogleDocsLogo,
  "google-drive": GoogleDriveLogo,
  helm: HelmLogo,
  "hugging-face": HuggingFaceLogo,
  instagram: InstagramLogo,
  intercom: IntercomLogo,
  jira: JiraLogo,
  kubernetes: KubernetesLogo,
  linear: LinearLogo,
  linkedin: LinkedInLogo,
  markdown: MarkdownLogo,
  mastodon: MastodonLogo,
  medium: MediumLogo,
  microsoft: MicrosoftLogo,
  "microsoft-onedrive": MicrosoftOnedriveLogo,
  "microsoft-sharepoint": MicrosoftSharepointLogo,
  "microsoft-teams": MicrosoftTeamsLogo,
  mistral: MistralLogo,
  "model-context-protocol": ModelContextProtocolLogo,
  nextjs: NextjsLogo,
  notion: NotionLogo,
  npm: NpmLogo,
  okta: OktaLogo,
  ollama: OllamaLogo,
  openai: OpenAILogo,
  pdf: PDFLogo,
  postgresql: PostgreSQLLogo,
  "product-hunt": ProductHuntLogo,
  python: PythonLogo,
  react: ReactLogo,
  reddit: RedditLogo,
  redis: RedisLogo,
  rss: RSSLogo,
  slack: SlackLogo,
  stripe: StripeLogo,
  substack: SubstackLogo,
  supabase: SupabaseLogo,
  telegram: TelegramLogo,
  threads: ThreadsLogo,
  typescript: TypeScriptLogo,
  vercel: VercelLogo,
  whatsapp: WhatsAppLogo,
  x: XLogo,
  "y-combinator": YCombinatorLogo,
  youtube: YouTubeLogo,
  zapier: ZapierLogo,
  zendesk: ZendeskLogo,
} as const satisfies Record<string, ((props: LogoProps) => React.ReactNode) & { title: string }>;

export type BrandName = keyof typeof brandLogos;

export const brandGroups: Record<string, BrandName[]> = {
  Sources: [
    "github",
    "gitlab",
    "slack",
    "discord",
    "telegram",
    "notion",
    "google-drive",
    "google-docs",
    "confluence",
    "jira",
    "linear",
    "dropbox",
    "microsoft-sharepoint",
    "microsoft-onedrive",
    "microsoft-teams",
    "zendesk",
    "intercom",
    "gmail",
    "markdown",
    "pdf",
    "rss",
  ],
  "AI providers": [
    "openai",
    "anthropic",
    "claude",
    "gemini",
    "mistral",
    "ollama",
    "hugging-face",
    "model-context-protocol",
    "cursor",
  ],
  Infrastructure: [
    "docker",
    "kubernetes",
    "helm",
    "postgresql",
    "redis",
    "aws",
    "azure",
    "cloudflare",
    "vercel",
    "supabase",
    "okta",
    "auth0",
    "stripe",
    "zapier",
  ],
  Developer: ["typescript", "python", "react", "nextjs", "npm"],
  Social: [
    "x",
    "linkedin",
    "bluesky",
    "threads",
    "mastodon",
    "reddit",
    "youtube",
    "instagram",
    "whatsapp",
    "product-hunt",
    "y-combinator",
    "medium",
    "substack",
  ],
  Companies: ["google", "microsoft", "figma"],
};

/** Render a logo by slug, e.g. <BrandLogo name="github" />. */
export function BrandLogo({ name, ...props }: LogoProps & { name: BrandName }) {
  const Logo = brandLogos[name];
  return <Logo {...props} />;
}
