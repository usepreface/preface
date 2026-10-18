import { createFileRoute, Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { Skeleton } from "@usepreface/ui/components/skeleton";
import { Spinner } from "@usepreface/ui/components/spinner";
import { ArrowRightIcon, BrowserIcon, ClockIcon, LinkIcon, MailIcon } from "@usepreface/ui/icons";

import { AuthHeading } from "#/components/auth/auth-layout";
import { StatusIcon, StatusPage } from "#/components/auth/status-page";
import { DetailList } from "#/components/data-display/detail-list";
import { feedback } from "#/lib/feedback";
import { placeholder } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationUrl } from "#/lib/urls";

export const Route = createFileRoute("/auth/email/verify")({
  head: () => ({ meta: [{ title: `Confirm sign-in · ${placeholder.instance.name}` }] }),
  validateSearch: previewSearch,
  component: MagicLink,
});

/*
 * Where the link in a sign-in email lands. Opening it never signs anyone in by itself; the
 * person confirms first. `?state=signing`, `?state=expired` and `?state=browser` preview the rest.
 */
function MagicLink() {
  const state = previewState(["signing", "expired", "browser"], Route.useSearch().state);
  return (
    <StatusPage topRight={placeholder.instance.name}>
      {state === "signing" ? (
        <Signing />
      ) : state === "expired" ? (
        <Expired />
      ) : state === "browser" ? (
        <OtherBrowser />
      ) : (
        <Confirm />
      )}
    </StatusPage>
  );
}

function Confirm() {
  const { slug } = placeholder.organization;
  return (
    <>
      <StatusIcon icon={LinkIcon} tone="accent" />
      <AuthHeading title="Confirm sign-in" align="center">
        Continue as <span className="font-medium text-foreground">marco@acme.dev</span> in this
        browser.
      </AuthHeading>
      <DetailList
        className="w-full rounded-xl border px-3.5"
        labelWidth="w-24"
        items={[
          { label: "Requested", value: "Chrome on macOS · 2 minutes ago" },
          { label: "Continue to", value: "Acme · Home" },
          { label: "Address", value: organizationUrl(slug), mono: true },
        ]}
      />
      <div className="flex w-full flex-col gap-2">
        <Link
          to="/auth/email/verify"
          search={{ state: "signing" }}
          className={buttonVariants({ size: "lg" })}
        >
          Continue to Acme
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
        <Link to="/sign-in" className={buttonVariants({ variant: "ghost" })}>
          I didn’t request this
        </Link>
      </div>
    </>
  );
}

function Signing() {
  return (
    <div role="status" aria-live="polite" className="flex w-full flex-col items-center gap-5">
      <Spinner className="size-8 text-icon-accent" />
      <AuthHeading title="Signing you in…" align="center">
        Checking your link and opening Acme. This only takes a moment.
      </AuthHeading>
      <div className="flex w-full flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-4/5 self-center" />
      </div>
    </div>
  );
}

function Expired() {
  return (
    <>
      <StatusIcon icon={ClockIcon} tone="warning" />
      <AuthHeading title="This link has expired" align="center">
        Sign-in links work once and last 10 minutes. This one was already used or is too old.
      </AuthHeading>
      <div className="flex w-full flex-col gap-2">
        <Button size="lg" onClick={() => feedback.sent("New link sent", "Check marco@acme.dev.")}>
          <MailIcon data-icon="inline-start" />
          Email me a new link
        </Button>
        <Link to="/sign-in" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Back to sign in
        </Link>
      </div>
      <p className="text-caption text-fg-tertiary">
        Already signed in somewhere else? You can close this tab.
      </p>
    </>
  );
}

const steps = [
  "Go back to the browser where you entered your email.",
  "Type the 8-digit code from the same email.",
  "You’ll land in Acme, signed in.",
];

function OtherBrowser() {
  return (
    <>
      <StatusIcon icon={BrowserIcon} tone="info" />
      <AuthHeading title="Open the link where you started" align="center">
        For your security, sign-in links only work in the browser that asked for them. This one was
        requested from Safari on another device.
      </AuthHeading>
      <div className="w-full overflow-hidden rounded-xl border text-left">
        <div className="border-b bg-surface-2 px-3.5 py-2.5 text-sm font-medium text-foreground">
          Use the code instead
        </div>
        <ol className="flex flex-col">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-medium text-fg-secondary">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <Link
        to="/sign-in"
        className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}
      >
        Sign in in this browser instead
      </Link>
    </>
  );
}
