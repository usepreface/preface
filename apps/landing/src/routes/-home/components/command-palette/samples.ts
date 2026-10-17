import {
  FileIcon,
  KeyIcon,
  PlusIcon,
  SettingsIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import type { BrandName } from "@usepreface/ui/logos/registry";

export const documents: {
  title: string;
  meta: string;
  icon: IconComponent | BrandName;
  words: string;
}[] = [
  {
    title: "runbooks/rotate-keys.md",
    meta: "acme/platform",
    icon: FileIcon,
    words: "runbook rotate keys secrets",
  },
  {
    title: "Key rotation policy",
    meta: "Notion · Security",
    icon: "notion",
    words: "key rotate policy security",
  },
  {
    title: "#infra - “rotating staging creds tonight”",
    meta: "Slack · 3 days ago",
    icon: "slack",
    words: "infra rotate staging credentials keys",
  },
  {
    title: "deploy.yml",
    meta: "acme/platform / .github",
    icon: "github",
    words: "deploy pipeline secrets",
  },
  {
    title: "Onboarding checklist",
    meta: "Notion · People",
    icon: "notion",
    words: "onboarding new hire",
  },
];

export const actions: { title: string; keys: string[]; icon: IconComponent }[] = [
  { title: "Connect a source", keys: ["C", "S"], icon: PlusIcon },
  { title: "Create API key", keys: ["C", "K"], icon: KeyIcon },
  { title: "Open settings", keys: ["G", ","], icon: SettingsIcon },
];
