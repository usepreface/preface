import * as React from "react";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { Avatar, AvatarFallback } from "@usepreface/ui/components/avatar";
import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import { Kbd } from "@usepreface/ui/components/kbd";
import { Label } from "@usepreface/ui/components/label";
import { Progress } from "@usepreface/ui/components/progress";
import { Tabs, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import {
  AiChatIcon,
  ArrowRightIcon,
  BrainIcon,
  ChatIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DatabaseIcon,
  HelpIcon,
  HomeIcon,
  InboxIcon,
  PlusIcon,
  SearchIcon,
  ServerIcon,
  ShieldIcon,
  UsersIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import {
  NoAIProviderIllustration,
  NoConnectorsIllustration,
  NoConversationsIllustration,
  NoOrganizationsIllustration,
  SelfHostedIllustration,
} from "@usepreface/ui/illustrations";
import { cn } from "@usepreface/ui/lib/utils";
import { DotGrid } from "@usepreface/ui/patterns";
import {
  FieldHint,
  PasswordInput,
  PasswordStrength,
  SetupSteps,
  UrlSlugInput,
  slugify,
  type SlugStatus,
} from "@usepreface/ui/preface/account-fields";
import { PageHeader, TopBar } from "@usepreface/ui/preface/layout";

import { AppSidebar } from "./dashboard";

/*
 * Figma pages 56–57 "Onboarding": set up the instance and owner, create the first organization
 * with an editable URL slug, then land on an empty organization dashboard. The screens are live:
 * submitting one moves to the next. The tabs jump to each Figma frame, including error states.
 */

const HOST = "preface.acme.dev/";
const TAKEN = new Set(["acme", "admin", "api", "settings", "preface"]);

type Screen = "instance" | "instance-error" | "org" | "org-taken" | "empty";

const screens: [Screen, string][] = [
  ["instance", "Set up instance"],
  ["instance-error", "Instance · error"],
  ["org", "Create organization"],
  ["org-taken", "Slug taken"],
  ["empty", "Empty organization"],
];

type Owner = { instance: string; name: string; email: string };

export function OnboardingPage() {
  const [screen, setScreen] = React.useState<Screen>("instance");
  const [owner, setOwner] = React.useState<Owner>({
    instance: "Acme Knowledge",
    name: "Aisha Khan",
    email: "aisha@acme.dev",
  });
  const [org, setOrg] = React.useState({ name: "Acme", slug: "acme" });

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b bg-background px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 font-mono text-2xs text-fg-secondary">
          <span className="size-1.5 rounded-full bg-primary" />
          Figma · 56–57 Onboarding
        </span>
        <Tabs value={screen} onValueChange={(v) => setScreen(v as Screen)}>
          <TabsList aria-label="Onboarding screen" className="flex-wrap">
            {screens.map(([v, label]) => (
              <TabsTrigger key={v} value={v}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div key={screen} className="animate-in duration-300 fade-in-0">
        {screen === "instance" || screen === "instance-error" ? (
          <InstanceScreen
            key={screen}
            owner={owner}
            mismatch={screen === "instance-error"}
            onDone={(o) => {
              setOwner(o);
              setScreen("org");
            }}
          />
        ) : screen === "org" || screen === "org-taken" ? (
          <OrgScreen
            key={screen}
            email={owner.email}
            taken={screen === "org-taken"}
            onDone={(o) => {
              setOrg(o);
              setScreen("empty");
            }}
          />
        ) : (
          <EmptyOrgScreen owner={owner} org={org} />
        )}
      </div>
    </div>
  );
}

/* ---------- shared auth layout ---------- */

function AuthLayout({
  step,
  aside,
  children,
}: {
  step: number;
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100svh-6.25rem)] bg-surface-1 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <PrefaceLogo size={22} />
          <span className="text-xs font-medium text-fg-tertiary">Step {step} of 2</span>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-105 flex-col gap-5">
            <SetupSteps steps={["Instance", "Organization"]} current={step} />
            {children}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-fg-tertiary">
            Preface v1.4.0 · self-hosted at {HOST.slice(0, -1)}
          </span>
          <span className="flex gap-4 font-medium text-fg-secondary">
            <a href="#" className="hover:text-foreground">
              Docs
            </a>
            <a href="#" className="hover:text-foreground">
              GitHub
            </a>
          </span>
        </div>
      </div>
      <aside className="relative hidden flex-col items-center justify-center gap-7 overflow-hidden border-l border-border-subtle bg-surface-2 p-16 lg:flex">
        <DotGrid color="#98A1B0" opacity={0.18} gap={24} radius={1} />
        <div className="relative flex flex-col items-center gap-7">{aside}</div>
      </aside>
    </div>
  );
}

function FormHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-heading-1 text-foreground">{title}</h1>
      <p className="text-sm text-fg-secondary">{children}</p>
    </div>
  );
}

function FormField({
  id,
  label,
  children,
  hints,
}: {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
  hints?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hints}
    </div>
  );
}

const big = "h-10 rounded-lg bg-surface-1 px-3 text-base md:text-base";

/* ---------- 1 · set up instance ---------- */

function InstanceScreen({
  owner,
  mismatch,
  onDone,
}: {
  owner: Owner;
  mismatch: boolean;
  onDone: (o: Owner) => void;
}) {
  const [values, setValues] = React.useState(owner);
  const [password, setPassword] = React.useState("Halcyon-Tide-58!");
  const [confirm, setConfirm] = React.useState(mismatch ? "Halcyon-Tide-85!" : "Halcyon-Tide-58!");
  const [submitted, setSubmitted] = React.useState(mismatch);
  const matches = confirm.length > 0 && confirm === password;
  const showMismatch =
    (submitted || confirm.length >= password.length) && !matches && Boolean(confirm);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  const ready =
    values.instance.trim() && values.name.trim() && emailOk && password.length >= 12 && matches;

  return (
    <AuthLayout
      step={1}
      aside={
        <>
          <SelfHostedIllustration className="h-72 w-auto" />
          <div className="flex max-w-100 flex-col items-center gap-2 text-center">
            <h2 className="text-heading-3">Your knowledge, on your servers</h2>
            <p className="text-sm text-fg-secondary">
              This instance runs on infrastructure you control. You’re the owner: you can add admins
              and organizations later.
            </p>
          </div>
          <Points
            items={[
              [
                ServerIcon,
                "Data stays in your network",
                "Documents, embeddings and logs never leave this instance.",
              ],
              [BrainIcon, "Bring your own models", "OpenAI, Anthropic, Azure, Bedrock or Ollama."],
              [
                ShieldIcon,
                "Owner account first",
                "SSO and SCIM can take over once you connect your IdP.",
              ],
            ]}
          />
        </>
      }
    >
      <FormHeading title="Set up your instance">
        Name this Preface instance and create the owner account. It takes under a minute.
      </FormHeading>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (ready) {
            onDone(values);
          }
        }}
      >
        <FormField
          id="instance-name"
          label="Instance name"
          hints={<FieldHint>Shown on the sign-in page and in emails.</FieldHint>}
        >
          <Input
            id="instance-name"
            className={big}
            value={values.instance}
            onChange={(e) => setValues((v) => ({ ...v, instance: e.target.value }))}
            required
          />
        </FormField>
        <div className="flex flex-col gap-3 sm:flex-row">
          <FormField id="owner-name" label="Owner name">
            <Input
              id="owner-name"
              className={big}
              autoComplete="name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              required
            />
          </FormField>
          <FormField
            id="owner-email"
            label="Email"
            hints={
              submitted && !emailOk ? (
                <FieldHint tone="danger">Enter an email like name@company.com.</FieldHint>
              ) : null
            }
          >
            <Input
              id="owner-email"
              type="email"
              className={big}
              autoComplete="email"
              value={values.email}
              aria-invalid={submitted && !emailOk ? true : undefined}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              required
            />
          </FormField>
        </div>
        <FormField id="password" label="Password" hints={<PasswordStrength value={password} />}>
          <PasswordInput
            id="password"
            value={password}
            defaultVisible={mismatch}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        <FormField
          id="confirm"
          label="Confirm password"
          hints={
            showMismatch ? (
              <FieldHint tone="danger" id="confirm-hint">
                Passwords don’t match. Check the last characters.
              </FieldHint>
            ) : matches ? (
              <FieldHint tone="success" id="confirm-hint">
                Passwords match
              </FieldHint>
            ) : null
          }
        >
          <PasswordInput
            id="confirm"
            value={confirm}
            defaultVisible={mismatch}
            aria-invalid={showMismatch || undefined}
            aria-describedby="confirm-hint"
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" size="lg" className="h-10 w-full">
          Create instance
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <p className="text-xs text-fg-tertiary">
          You can change the instance name in Settings. The owner can’t be removed, only
          transferred.
        </p>
      </form>
    </AuthLayout>
  );
}

function Points({ items }: { items: [IconComponent, string, string][] }) {
  return (
    <ul className="flex w-full max-w-100 flex-col gap-3.5">
      {items.map(([Icon, title, text]) => (
        <li key={title} className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
            <Icon className="size-4 text-icon-accent" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs text-fg-secondary">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- 2 · create organization ---------- */

function suggestions(base: string) {
  return ["hq", "inc", "team", "labs", "co"]
    .map((s) => `${base}-${s}`)
    .filter((s) => !TAKEN.has(s))
    .slice(0, 3);
}

function OrgScreen({
  email,
  taken,
  onDone,
}: {
  email: string;
  taken: boolean;
  onDone: (o: { name: string; slug: string }) => void;
}) {
  const [name, setName] = React.useState("Acme");
  // The default frame shows "acme" free; the Slug taken frame shows it in use.
  const unavailableSlugs = React.useMemo(() => {
    const s = new Set(TAKEN);
    if (!taken) {
      s.delete("acme");
    }
    return s;
  }, [taken]);
  const [slug, setSlug] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);
  const current = slug ?? slugify(name);

  React.useEffect(() => {
    setChecking(true);
    const t = window.setTimeout(() => setChecking(false), 250);
    return () => window.clearTimeout(t);
  }, [current]);

  const status: SlugStatus = !current
    ? "idle"
    : checking
      ? "checking"
      : unavailableSlugs.has(current)
        ? "taken"
        : "available";
  const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(current) && current.length >= 2;

  return (
    <AuthLayout
      step={2}
      aside={
        <>
          <NoOrganizationsIllustration className="h-64 w-auto" />
          <span className="text-2xs font-semibold tracking-widest text-fg-tertiary uppercase">
            Preview
          </span>
          <OrgPreview name={name || "Organization"} slug={current || "your-org"} />
        </>
      }
    >
      <div className="flex items-center gap-2 rounded-lg bg-success-bg px-3 py-2 text-13 font-medium text-success-fg">
        <CheckCircleIcon className="size-4 shrink-0" />
        Instance created. Signed in as {email}.
      </div>
      <FormHeading title="Create your first organization">
        Organizations hold sources, members, channels and API keys. Most companies need one.
      </FormHeading>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && valid && status === "available") {
            onDone({ name: name.trim(), slug: current });
          }
        }}
      >
        <FormField
          id="org-name"
          label="Organization name"
          hints={<FieldHint>Your company or team name. You can rename it later.</FieldHint>}
        >
          <Input
            id="org-name"
            className={big}
            value={name}
            autoComplete="organization"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <FormField
          id="org-slug"
          label="URL"
          hints={
            <>
              {status === "taken" ? (
                <>
                  <FieldHint tone="danger" id="slug-hint">
                    {current} is already used on this instance.
                  </FieldHint>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-fg-tertiary">Try</span>
                    {suggestions(current).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlug(s)}
                        className="rounded-md border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-xs outline-none hover:border-border-default hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <FieldHint id="slug-hint">
                    Suggested from the name. Lowercase letters, numbers and dashes.
                  </FieldHint>
                  {status === "available" && valid ? (
                    <FieldHint tone="success">{current} is available</FieldHint>
                  ) : null}
                </>
              )}
            </>
          }
        >
          <UrlSlugInput
            key={slug === null || slug === undefined ? "auto" : "edited"}
            id="org-slug"
            prefix={HOST}
            source={slug === null || slug === undefined ? name : undefined}
            value={current}
            onValueChange={(s) => setSlug(s)}
            status={status === "checking" ? "idle" : status}
            aria-describedby="slug-hint"
          />
        </FormField>
        <Button
          type="submit"
          size="lg"
          className="h-10 w-full"
          disabled={!name.trim() || !valid || status !== "available"}
        >
          Create organization
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <p className="text-xs text-fg-tertiary">
          You’ll be the organization’s owner. Invite admins and members on the next screen.
        </p>
      </form>
    </AuthLayout>
  );
}

function OrgPreview({ name, slug }: { name: string; slug: string }) {
  const items: [string, IconComponent][] = [
    ["Home", HomeIcon],
    ["Ask", AiChatIcon],
    ["Sources", DatabaseIcon],
    ["Channels", ChatIcon],
    ["Members", UsersIcon],
  ];
  return (
    <div
      aria-hidden="true"
      className="w-90 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 shadow-lg"
    >
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-3.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="truncate font-mono text-2xs text-fg-tertiary">
            {HOST}
            {slug}
          </span>
        </span>
        <ChevronDownIcon className="size-3.5 text-icon-secondary" />
      </div>
      <div className="flex flex-col gap-0.5 p-2">
        {items.map(([label, Icon], i) => (
          <span
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              i === 0 ? "bg-selected font-medium" : "text-fg-secondary",
            )}
          >
            <Icon className={cn("size-4", i === 0 ? "text-icon" : "text-icon-secondary")} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- 3 · empty organization ---------- */

function EmptyOrgScreen({ owner, org }: { owner: Owner; org: { name: string; slug: string } }) {
  const first = owner.name.split(/\s+/)[0] ?? owner.name;
  const initials = owner.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const steps: [
    string,
    React.ComponentType<{ className?: string }>,
    string,
    string,
    IconComponent | null,
    boolean,
  ][] = [
    [
      "Connect a source",
      NoConnectorsIllustration,
      "GitHub, Slack, Notion, Drive, websites or files. Preface indexes and keeps them fresh.",
      "Connect source",
      PlusIcon,
      true,
    ],
    [
      "Choose an AI provider",
      NoAIProviderIllustration,
      "Use OpenAI, Anthropic, Azure or Bedrock, or a local model through Ollama.",
      "Add provider",
      null,
      false,
    ],
    [
      "Ask your first question",
      NoConversationsIllustration,
      "Try the playground once a source has synced. Every answer cites where it came from.",
      "Open playground",
      AiChatIcon,
      false,
    ],
  ];
  return (
    <div className="flex min-h-[calc(100svh-6.25rem)] flex-col bg-canvas">
      <TopBar>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-hover"
        >
          <span className="flex size-6 items-center justify-center rounded-[6px] bg-primary text-xs font-semibold text-primary-foreground">
            {org.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-sm font-medium">{org.name}</span>
          <ChevronDownIcon size={14} className="text-icon-secondary" />
        </button>
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            className="flex h-8 w-full max-w-120 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-fg-tertiary hover:border-border-default"
          >
            <SearchIcon className="text-icon-secondary" />
            <span className="flex-1 text-left">Search or ask anything</span>
            <Kbd>⌘K</Kbd>
          </button>
        </div>
        <Button variant="ghost" size="icon" aria-label="Inbox">
          <InboxIcon />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpIcon />
        </Button>
        <Avatar size="sm">
          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
      </TopBar>
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <AppSidebar
          active="Home"
          title={org.name}
          counts={false}
          status={`${HOST.slice(0, -1)} · 1 worker · idle`}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
          <PageHeader
            icon={<HomeIcon />}
            title="Home"
            actions={
              <Button>
                <UsersIcon data-icon="inline-start" />
                Invite members
              </Button>
            }
          />
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-8 py-7">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h1 className="text-heading-2">
                  Welcome to {org.name}, {first}
                </h1>
                <p className="text-sm text-fg-secondary">
                  Your organization is ready. Three steps to the first cited answer.
                </p>
              </div>
              <div className="flex w-55 flex-col gap-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-fg-secondary">Setup</span>
                  <span className="text-fg-tertiary">0 of 3</span>
                </div>
                <Progress value={0} aria-label="Setup progress" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(([title, Art, text, cta, Icon, primary], i) => (
                <div
                  key={title}
                  className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-1"
                >
                  <div className="flex h-37.5 items-center justify-center border-b border-border-subtle bg-surface-2">
                    <Art className="h-30 w-auto" />
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-2 p-4.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full text-xs font-medium",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-3 text-fg-secondary",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold">{title}</span>
                    </div>
                    <p className="flex-1 text-13 text-fg-secondary">{text}</p>
                    <Button variant={primary ? "default" : "outline"} className="mt-1">
                      {Icon ? <Icon data-icon="inline-start" /> : null}
                      {cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_380px]">
              <div className="flex min-h-48 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-1">
                <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                  <span className="flex-1 text-sm font-semibold">Sources</span>
                  <Badge>0</Badge>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-6 text-center">
                  <DatabaseIcon className="size-5 text-icon-secondary" />
                  <span className="text-sm font-medium">No sources yet</span>
                  <span className="text-xs text-fg-tertiary">
                    Connected sources and their sync status will show up here.
                  </span>
                </div>
              </div>
              <InviteCard owner={owner} initials={initials} orgSlug={org.slug} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function InviteCard({
  owner,
  initials,
  orgSlug,
}: {
  owner: Owner;
  initials: string;
  orgSlug: string;
}) {
  const domain = owner.email.split("@")[1] ?? "acme.dev";
  const [email, setEmail] = React.useState("");
  const [invited, setInvited] = React.useState<string[]>([]);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-1 p-4">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-semibold">Invite your team</span>
        <span className="text-xs text-fg-tertiary">
          {1 + invited.length} {invited.length ? "members" : "member"}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{owner.name}</span>
          <span className="truncate text-xs text-fg-tertiary">{owner.email}</span>
        </span>
        <Badge tone="info">Owner</Badge>
      </div>
      {invited.map((m) => (
        <div key={m} className="flex items-center gap-2.5">
          <Avatar>
            <AvatarFallback>{m.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm">{m}</span>
          <Badge variant="outline">Invited</Badge>
        </div>
      ))}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !invited.includes(email)) {
            setInvited((l) => [...l, email]);
            setEmail("");
          }
        }}
      >
        <Input
          type="email"
          aria-label={`Invite to ${orgSlug}`}
          placeholder={`name@${domain}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Invite
        </Button>
      </form>
    </div>
  );
}
