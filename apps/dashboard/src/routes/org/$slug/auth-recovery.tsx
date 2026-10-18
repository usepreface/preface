import * as React from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { Checkbox } from "@usepreface/ui/components/checkbox";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  KeyIcon,
  UserCircleIcon,
} from "@usepreface/ui/icons";
import {
  ConnectionLostIllustration,
  IndexingCompleteIllustration,
} from "@usepreface/ui/illustrations";

import { AuthAside } from "#/components/auth/auth-aside";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { StatusIcon } from "#/components/auth/status-page";
import { Checklist } from "#/components/data-display/checklist";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { me } from "#/components/shell/me";
import { recoveryForm } from "#/forms/authentication";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { organizationBySlug, recoveryCredential } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

export const Route = createFileRoute("/org/$slug/auth-recovery")({
  head: () => ({ meta: [{ title: "Recover access · Preface" }] }),
  validateSearch: previewSearch,
  component: AuthRecovery,
});

/*
 * When the organization's SSO is down, an owner signed in with an email code makes SSO optional
 * with the recovery credential. Outside the app shell: the owner may not be able to load it.
 * `?state=recovered` shows the result.
 */
function AuthRecovery() {
  const { slug } = Route.useParams();
  const organization = organizationBySlug(slug);
  const [recovered, setRecovered] = React.useState(
    previewState(["recovered"], Route.useSearch().state) === "recovered",
  );

  return (
    <AuthLayout
      topRight={`${organization.name} · recovery`}
      aside={<RecoveryAside done={recovered} />}
    >
      {recovered ? (
        <Recovered slug={slug} name={organization.name} />
      ) : (
        <RecoverForm name={organization.name} onRecovered={() => setRecovered(true)} />
      )}
    </AuthLayout>
  );
}

function RecoveryAside({ done }: { done: boolean }) {
  return (
    <AuthAside
      art={
        done ? (
          <IndexingCompleteIllustration className="h-64 w-auto" />
        ) : (
          <ConnectionLostIllustration className="h-64 w-auto" />
        )
      }
      title={done ? "You’re back in" : "When single sign-on is down"}
      description={
        done
          ? "Members can sign in with email codes or Google until you require SSO again."
          : "If your identity provider is unavailable, an owner can make SSO optional for a while so people can still get in."
      }
      points={[
        [UserCircleIcon, "Owners only", "You must already be an owner and confirm your email."],
        [
          KeyIcon,
          "One-time credential",
          "The recovery credential works once. Generate a new one after.",
        ],
        [
          ActivityIcon,
          "Fully logged",
          "Recovery is recorded in the organization’s activity history.",
        ],
      ]}
    />
  );
}

function RecoverForm({ name, onRecovered }: { name: string; onRecovered: () => void }) {
  const [understood, setUnderstood] = React.useState(false);
  const form = useSchemaForm(recoveryForm, { defaultValues: { recoveryCredential: "" } });

  return (
    <>
      <AuthHeading title={`Recover access to ${name}`}>
        Use this only if your identity provider is down and nobody can sign in. Recovering makes SSO
        optional for everyone until an owner requires it again.
      </AuthHeading>
      <form noValidate className="flex flex-col gap-5" onSubmit={form.handleSubmit(onRecovered)}>
        <ol className="overflow-hidden rounded-xl border">
          <li className="flex items-center gap-3 border-b bg-success-bg px-3.5 py-3">
            <CheckCircleIcon className="size-4.5 shrink-0 text-success-fg" aria-label="Done" />
            <span className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Signed in as an owner</span>
              <span className="text-caption text-fg-secondary">
                {me.email} · email code confirmed 1 minute ago
              </span>
            </span>
          </li>
          <li className="flex flex-col gap-2.5 px-3.5 py-3">
            <span className="flex items-center gap-3">
              <span className="flex size-4.5 items-center justify-center rounded-full border border-border-focus bg-primary-subtle text-2xs font-medium text-fg-accent">
                2
              </span>
              <span className="text-sm font-medium text-foreground">
                Enter the recovery credential
              </span>
            </span>
            <TextField
              control={form.control}
              name="recoveryCredential"
              label={<span className="sr-only">Recovery credential</span>}
              className="gap-0"
              leading={<KeyIcon />}
              inputProps={{
                placeholder: recoveryCredential.replace(/[A-Z0-9]/g, "•").slice(0, 24),
                autoComplete: "off",
                spellCheck: false,
                className: "font-mono text-mono-sm",
              }}
            />
          </li>
        </ol>
        <label className="flex items-start gap-2.5 text-sm text-foreground">
          <Checkbox
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked === true)}
            className="mt-0.5"
          />
          I understand SSO becomes optional for everyone in {name}
        </label>
        <SubmitButton
          variant="destructive"
          size="lg"
          wide
          disabled={!understood}
          pending={form.formState.isSubmitting}
        >
          Recover and make SSO optional
        </SubmitButton>
      </form>
      <p className="text-caption text-fg-tertiary">
        Lost the credential too? Another owner can recover, or an instance owner can help from the
        instance settings.
      </p>
    </>
  );
}

function Recovered({ slug, name }: { slug: string; name: string }) {
  return (
    <>
      <StatusIcon icon={CheckCircleIcon} tone="success" size="lg" />
      <AuthHeading title="SSO is now optional">
        {name} members can sign in with email codes and Google again. Fix your identity provider,
        then turn the requirement back on.
      </AuthHeading>
      <Checklist
        checks={[
          {
            state: "todo",
            title: "Repair the Okta connection",
            detail: "Last error: certificate expired Oct 30",
            action: (
              <Link
                to="/org/$slug/settings/connections"
                params={{ slug }}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Open
              </Link>
            ),
          },
          {
            state: "todo",
            title: "Generate a new recovery credential",
            detail: "The one you used no longer works.",
            action: (
              <Button variant="outline" size="sm" onClick={feedback.notConnected}>
                Generate
              </Button>
            ),
          },
          {
            state: "waiting",
            title: "Require SSO again",
            detail: "Available once Okta passes a test sign-in.",
          },
        ]}
      />
      <Link
        to="/org/$slug/settings/authentication"
        params={{ slug }}
        className={buttonVariants({ size: "lg" })}
      >
        Go to login policy
        <ArrowRightIcon data-icon="inline-end" />
      </Link>
    </>
  );
}
