import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";
import { Spinner } from "@usepreface/ui/components/spinner";
import { ArrowRightIcon, CheckCircleIcon, LinkIcon } from "@usepreface/ui/icons";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { EmailRecipient } from "#/components/auth/auth-parts";
import { StatusIcon } from "#/components/auth/status-page";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { Notice } from "#/components/feedback/notice";
import { feedback } from "#/lib/feedback";
import { placeholder } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationUrl } from "#/lib/urls";

import { CodeAside } from "./-components/sign-in-asides";

export const Route = createFileRoute("/sign-in/verify")({
  head: () => ({ meta: [{ title: `Enter your code · ${placeholder.instance.name}` }] }),
  validateSearch: previewSearch,
  component: SignInCode,
});

const email = "marco@acme.dev";

/** The sign-in code. `?state=incorrect`, `?state=expired` and `?state=done` preview the others. */
function SignInCode() {
  const navigate = useNavigate();
  const state = previewState(["incorrect", "expired", "done"], Route.useSearch().state);

  return (
    <AuthLayout topRight={placeholder.instance.name} aside={<CodeAside />}>
      {state === "done" ? (
        <SignedIn />
      ) : (
        <>
          <AuthHeading title="Enter the code we emailed">
            We sent an 8-digit code to <span className="font-medium text-foreground">{email}</span>.
          </AuthHeading>
          <EmailRecipient email={email} onAction={() => navigate({ to: "/sign-in" })} />
          <VerifyCodeForm
            key={state ?? "default"}
            state={state}
            label="Sign-in code"
            submitLabel="Sign in"
            attemptsLeft={3}
            resendIn="0:38"
            expiredDetail="Codes and links last 10 minutes. Send a new email to keep going."
            onVerified={() => navigate({ to: "/sign-in/verify", search: { state: "done" } })}
            onResend={() => feedback.sent("Code sent", `Check ${email}.`)}
          />
          <Notice tone="neutral" icon={LinkIcon} title="Prefer the link?">
            The email also has a sign-in link. Open it in this browser and you’ll continue
            automatically, no code needed.
          </Notice>
        </>
      )}
    </AuthLayout>
  );
}

function SignedIn() {
  const { slug } = placeholder.organization;
  return (
    <>
      <StatusIcon icon={CheckCircleIcon} tone="success" size="lg" />
      <AuthHeading title="You’re signed in">
        Welcome back, Marco. Taking you to Acme · Home.
      </AuthHeading>
      <div
        role="status"
        className="flex items-center gap-2.5 rounded-lg border bg-surface-2 px-3.5 py-3"
      >
        <Spinner className="size-4 text-icon-secondary" />
        <span className="truncate font-mono text-mono-sm text-fg-secondary">
          Opening {organizationUrl(slug)}
        </span>
      </div>
      <Link
        to="/org/$slug"
        params={{ slug }}
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        Continue now
        <ArrowRightIcon data-icon="inline-end" />
      </Link>
    </>
  );
}
