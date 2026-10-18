import { createFileRoute, Link } from "@tanstack/react-router";

import { Schema } from "effect";

import { Button, buttonVariants } from "@usepreface/ui/components/button";
import {
  AlertIcon,
  ClockIcon,
  RefreshIcon,
  UsersIcon,
  WifiIcon,
  XCircleIcon,
  type IconComponent,
} from "@usepreface/ui/icons";

import { AuthHeading } from "#/components/auth/auth-layout";
import { StatusIcon, StatusPage, type StatusTone } from "#/components/auth/status-page";
import { DetailList } from "#/components/data-display/detail-list";
import { feedback } from "#/lib/feedback";
import { placeholder } from "#/lib/placeholder";

/*
 * Where failed sign-ins land. `reason` comes from the API's redirect; each reason has its own
 * message and next step, and anything unknown falls back to the generic failure.
 */
const reasons = {
  cancelled: {
    icon: XCircleIcon,
    tone: "neutral",
    title: "Sign-in was cancelled",
    description: "You closed the Google window before finishing. Nothing was changed.",
    retry: "Try again",
  },
  expired: {
    icon: ClockIcon,
    tone: "warning",
    title: "Your sign-in expired",
    description:
      "It took longer than 10 minutes, so we stopped it. Start again for a fresh request.",
    retry: "Start again",
  },
  provider_unavailable: {
    icon: WifiIcon,
    tone: "danger",
    title: "Okta isn’t available",
    description: "Globex Research’s identity provider didn’t respond. Try again in a few minutes.",
    retry: "Try again",
  },
  account_mismatch: {
    icon: UsersIcon,
    tone: "warning",
    title: "That account doesn’t match",
    description: "You signed in to Okta as marco@globex.com, but started with marco@acme.dev.",
    retry: "Use another account",
  },
} satisfies Record<
  string,
  { icon: IconComponent; tone: StatusTone; title: string; description: string; retry: string }
>;

type Reason = keyof typeof reasons;

export const Route = createFileRoute("/auth/error")({
  head: () => ({ meta: [{ title: `Couldn’t sign you in · ${placeholder.instance.name}` }] }),
  validateSearch: Schema.toStandardSchemaV1(
    Schema.Struct({ reason: Schema.optional(Schema.String) }),
  ),
  component: AuthError,
});

function isReason(value: string | undefined): value is Reason {
  return value !== undefined && value in reasons;
}

function AuthError() {
  const { reason } = Route.useSearch();
  return (
    <StatusPage topRight={placeholder.instance.name} width="lg">
      {isReason(reason) ? <KnownReason reason={reason} /> : <GenericFailure />}
    </StatusPage>
  );
}

function KnownReason({ reason }: { reason: Reason }) {
  const look = reasons[reason];
  return (
    <>
      <StatusIcon icon={look.icon} tone={look.tone} />
      <AuthHeading title={look.title} align="center">
        {look.description}
      </AuthHeading>
      <Actions retry={look.retry} />
    </>
  );
}

function GenericFailure() {
  return (
    <>
      <StatusIcon icon={AlertIcon} tone="danger" />
      <AuthHeading title="We couldn’t sign you in" align="center">
        Okta didn’t respond, so Preface couldn’t finish single sign-on for Globex Research. Nothing
        about your account changed.
      </AuthHeading>
      <DetailList
        className="w-full rounded-xl border px-3.5"
        labelWidth="w-28"
        items={[
          { label: "Reason", value: "Identity provider unavailable" },
          { label: "Organization", value: "Globex Research" },
          { label: "Error code", value: "sso_provider_unavailable", mono: true },
          { label: "Reference", value: "req_8f2c1a9d", mono: true },
        ]}
      />
      <Actions retry="Try again" />
      <p className="text-caption text-fg-tertiary">
        If this keeps happening, send the reference to your Globex admin.
      </p>
    </>
  );
}

function Actions({ retry }: { retry: string }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <Button size="lg" onClick={feedback.notConnected}>
        <RefreshIcon data-icon="inline-start" />
        {retry}
      </Button>
      <Link to="/sign-in" className={buttonVariants({ variant: "outline", size: "lg" })}>
        Back to sign in
      </Link>
    </div>
  );
}
