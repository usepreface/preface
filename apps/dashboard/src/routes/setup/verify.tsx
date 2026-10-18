import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";
import { ChevronLeftIcon } from "@usepreface/ui/icons";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { EmailRecipient } from "#/components/auth/auth-parts";
import { VerifyCodeForm } from "#/components/auth/verify-code-form";
import { feedback } from "#/lib/feedback";
import { placeholder } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { setupSteps, VerifyAside } from "./-components/setup-asides";

export const Route = createFileRoute("/setup/verify")({
  head: () => ({ meta: [{ title: "Check your email · Preface" }] }),
  validateSearch: previewSearch,
  component: VerifyOwner,
});

/** Step 2: the owner's email code. `?state=incorrect` and `?state=expired` preview the errors. */
function VerifyOwner() {
  const navigate = useNavigate();
  const state = previewState(["incorrect", "expired"], Route.useSearch().state);
  const { email } = placeholder.owner;

  return (
    <AuthLayout
      steps={{ labels: setupSteps, current: 2 }}
      topRight="Step 2 of 3"
      aside={<VerifyAside />}
    >
      <AuthHeading title="Check your email">
        We sent an 8-digit code to <span className="font-medium text-foreground">{email}</span>.
        Enter it to confirm you own this instance.
      </AuthHeading>
      <EmailRecipient email={email} onAction={() => navigate({ to: "/setup" })} />
      <VerifyCodeForm
        key={state ?? "default"}
        state={state}
        submitLabel="Verify email"
        onVerified={() => navigate({ to: "/setup/organization" })}
        onResend={() => feedback.sent("Code sent", `Check ${email}.`)}
      />
      <Link
        to="/setup"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
      >
        <ChevronLeftIcon data-icon="inline-start" />
        Back to instance details
      </Link>
    </AuthLayout>
  );
}
