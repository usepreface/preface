import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import {
  AiChatIcon,
  ArrowRightIcon,
  ChatIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DatabaseIcon,
  HomeIcon,
  UsersIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { NoOrganizationsIllustration } from "@usepreface/ui/illustrations";
import { cn } from "@usepreface/ui/lib/utils";
import {
  FieldHint,
  UrlSlugInput,
  slugify,
  type SlugStatus,
} from "@usepreface/ui/preface/account-fields";

import { AuthLayout, FormHeading, FormField, formInputClassName, DEMO_HOST } from "./layout";

const TAKEN = new Set(["acme", "admin", "api", "settings", "preface"]);

function suggestions(base: string) {
  return ["hq", "inc", "team", "labs", "co"]
    .map((s) => `${base}-${s}`)
    .filter((s) => !TAKEN.has(s))
    .slice(0, 3);
}

export function OrgScreen({
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
            className={formInputClassName}
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
            prefix={DEMO_HOST}
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
            {DEMO_HOST}
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
