import * as React from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import { ArrowRightIcon, CheckCircleIcon } from "@usepreface/ui/icons";
import { NoOrganizationsIllustration } from "@usepreface/ui/illustrations";
import {
  FieldHint,
  UrlSlugInput,
  slugify,
  type SlugStatus,
} from "@usepreface/ui/preface/account-fields";

import { placeholder, reservedSlugs } from "../../lib/placeholder";
import { OrgPreview } from "./-components/org-preview";
import { SetupField, SetupHeading, SetupLayout, largeInput } from "./-components/setup-layout";

export const Route = createFileRoute("/setup/organization")({
  head: () => ({ meta: [{ title: "Create your organization · Preface" }] }),
  component: OrganizationSetup,
});

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function suggestions(base: string) {
  return ["hq", "inc", "team", "labs", "co"]
    .map((suffix) => `${base}-${suffix}`)
    .filter((slug) => !reservedSlugs.has(slug))
    .slice(0, 3);
}

/*
 * Step 2, Figma "Create organization" and "Slug taken". The URL follows the name until it is
 * edited. Availability is faked against `reservedSlugs` after a short pause, like a lookup.
 */
function OrganizationSetup() {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);
  const current = slug ?? slugify(name);

  React.useEffect(() => {
    setChecking(true);
    const id = window.setTimeout(() => setChecking(false), 300);
    return () => window.clearTimeout(id);
  }, [current]);

  const valid = VALID_SLUG.test(current) && current.length >= 2;
  const status: SlugStatus | "checking" = !current
    ? "idle"
    : checking
      ? "checking"
      : reservedSlugs.has(current)
        ? "taken"
        : valid
          ? "available"
          : "idle";
  const ready = Boolean(name.trim()) && valid && status === "available";

  return (
    <SetupLayout
      step={2}
      aside={
        <>
          <NoOrganizationsIllustration className="h-64 w-auto" />
          <span className="text-2xs font-semibold tracking-widest text-fg-tertiary uppercase">
            Preview
          </span>
          <OrgPreview name={name.trim() || "Organization"} slug={current || "your-org"} />
        </>
      }
    >
      <div
        role="status"
        className="flex animate-in items-center gap-2 rounded-lg bg-success-bg px-3 py-2 text-13 font-medium text-success-fg duration-500 fade-in-0 slide-in-from-top-1"
      >
        <CheckCircleIcon className="size-4 shrink-0" />
        Instance created. Signed in as {placeholder.owner.email}.
      </div>
      <SetupHeading title="Create your first organization">
        Organizations hold sources, members, channels and API keys. Most companies need one.
      </SetupHeading>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) {
            void navigate({ to: "/" });
          }
        }}
      >
        <SetupField
          id="org-name"
          label="Organization name"
          hints={<FieldHint>Your company or team name. You can rename it later.</FieldHint>}
        >
          <Input
            id="org-name"
            className={largeInput}
            placeholder={placeholder.organization.name}
            value={name}
            autoComplete="organization"
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </SetupField>
        <SetupField
          id="org-slug"
          label="URL"
          hints={
            status === "taken" ? (
              <>
                <FieldHint tone="danger" id="slug-hint">
                  {current} is already used on this instance.
                </FieldHint>
                <div className="flex animate-in flex-wrap items-center gap-2 duration-300 fade-in-0">
                  <span className="text-xs text-fg-tertiary">Try</span>
                  {suggestions(current).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlug(s)}
                      className="rounded-md border border-border-subtle bg-surface-2 px-2 py-0.5 font-mono text-xs text-foreground outline-none transition-colors hover:border-border-default hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring"
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
                {status === "available" ? (
                  <FieldHint tone="success">{current} is available</FieldHint>
                ) : null}
              </>
            )
          }
        >
          <UrlSlugInput
            key={slug === null ? "auto" : "edited"}
            id="org-slug"
            prefix={`${placeholder.instance.host}/`}
            source={slug === null ? name : undefined}
            value={current}
            placeholder={placeholder.organization.slug}
            onValueChange={(s) => setSlug(s)}
            status={status === "checking" ? "idle" : status}
            aria-describedby="slug-hint"
          />
        </SetupField>
        <Button type="submit" size="lg" className="group h-10 w-full" disabled={!ready}>
          Create organization
          <ArrowRightIcon
            data-icon="inline-end"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Button>
        <p className="text-xs text-fg-tertiary">
          You’ll be the organization’s owner. Invite admins and members on the next screen.
        </p>
      </form>
    </SetupLayout>
  );
}
