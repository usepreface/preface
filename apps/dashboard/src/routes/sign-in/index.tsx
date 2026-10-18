import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { MailIcon } from "@usepreface/ui/icons";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { EmailRecipient, OrDivider, ProviderButton } from "#/components/auth/auth-parts";
import { SlugField } from "#/components/form/slug-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { organizationUrlForm, signInEmailForm } from "#/forms/sign-in";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { organizations, placeholder } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { organizationUrlPrefix } from "#/lib/urls";

import { SignInAside } from "./-components/sign-in-asides";
import { SsoOption } from "./-components/sso-option";

export const Route = createFileRoute("/sign-in/")({
  head: () => ({ meta: [{ title: `Sign in · ${placeholder.instance.name}` }] }),
  validateSearch: previewSearch,
  component: SignIn,
});

/*
 * Email discovery. The email decides what comes next: a code, one organization's SSO, a choice
 * between several (`?state=sso`), or the organization's URL when the domain matches nothing
 * (`?state=slug`). `?state=checking` previews the lookup.
 */
function SignIn() {
  const state = previewState(["checking", "sso", "slug"], Route.useSearch().state);
  return (
    <AuthLayout topRight={placeholder.instance.name} aside={<SignInAside />}>
      {state === "sso" ? (
        <ChooseOrganization />
      ) : state === "slug" ? (
        <FindOrganization />
      ) : (
        <EmailStep checking={state === "checking"} />
      )}
    </AuthLayout>
  );
}

function EmailStep({ checking }: { checking: boolean }) {
  const navigate = useNavigate();
  const form = useSchemaForm(signInEmailForm, {
    defaultValues: { email: checking ? "marco@acme.dev" : "" },
  });

  return (
    <>
      <AuthHeading title={`Sign in to ${placeholder.instance.name}`}>
        Use your work email. We’ll show the sign-in options your organization allows.
      </AuthHeading>
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={form.handleSubmit(() => navigate({ to: "/sign-in/verify" }))}
      >
        <TextField
          control={form.control}
          name="email"
          label="Work email"
          size="lg"
          leading={<MailIcon />}
          inputProps={{
            type: "email",
            placeholder: "name@company.com",
            autoComplete: "email",
            autoFocus: true,
            disabled: checking,
          }}
        />
        <SubmitButton
          size="lg"
          wide
          arrow
          pending={checking}
          pendingLabel="Checking sign-in options…"
        >
          Continue
        </SubmitButton>
      </form>
      <OrDivider />
      <ProviderButton brand="google" disabled={checking} onClick={feedback.notConnected}>
        Continue with Google
      </ProviderButton>
      <InvitationOnly />
    </>
  );
}

function ChooseOrganization() {
  const navigate = useNavigate();
  const email = "marco@acme.dev";
  return (
    <>
      <AuthHeading title="Choose how to sign in">
        {email} belongs to more than one organization. Pick the one you want to open.
      </AuthHeading>
      <EmailRecipient
        email={email}
        actionLabel="Change"
        onAction={() => navigate({ to: "/sign-in" })}
      />
      <div className="flex flex-col gap-2.5">
        <SsoOption
          brand="okta"
          title="Continue with Okta"
          detail="Acme · SSO required for acme.dev"
          recommended
          onSelect={feedback.notConnected}
        />
        <SsoOption
          brand="microsoft"
          title="Continue with Microsoft Entra ID"
          detail="Initech Support"
          onSelect={feedback.notConnected}
        />
      </div>
      <OrDivider />
      <ProviderButton brand="google" onClick={feedback.notConnected}>
        Continue with Google
      </ProviderButton>
      <Button
        variant="ghost"
        size="lg"
        className="w-full"
        onClick={() => navigate({ to: "/sign-in/verify" })}
      >
        <MailIcon data-icon="inline-start" />
        Email me a code
      </Button>
      <p className="text-caption text-fg-tertiary">
        Acme requires Okta for acme.dev addresses. Email codes still work for Initech Support.
      </p>
    </>
  );
}

function FindOrganization() {
  const navigate = useNavigate();
  const email = "lena@contractor.io";
  const form = useSchemaForm(organizationUrlForm, {
    defaultValues: { organizationSlug: "globex" },
  });
  const slug = form.watch("organizationSlug");
  const organization = organizations.find((candidate) => candidate.slug === slug);
  const match = organization
    ? `${organization.name} · signs in with ${organization.provider ? providers[organization.provider] : "email codes or Google"}`
    : null;

  return (
    <>
      <AuthHeading title="Find your organization">
        We couldn’t match contractor.io to an organization’s SSO. Enter the organization’s URL to
        use its single sign-on.
      </AuthHeading>
      <EmailRecipient
        email={email}
        actionLabel="Change"
        onAction={() => navigate({ to: "/sign-in" })}
      />
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={form.handleSubmit(feedback.notConnected)}
      >
        <SlugField
          control={form.control}
          name="organizationSlug"
          label="Organization URL"
          prefix={organizationUrlPrefix}
          status={match ? "available" : "idle"}
          description={match ?? "The part after /org/ in your organization’s address."}
        />
        <SubmitButton size="lg" wide>
          Continue with single sign-on
        </SubmitButton>
      </form>
      <OrDivider />
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => navigate({ to: "/sign-in/verify" })}
      >
        <MailIcon data-icon="inline-start" />
        Email me a code instead
      </Button>
      <p className="text-caption text-fg-tertiary">
        Your organization’s URL is in invitation emails and in the address bar once you’re signed
        in.
      </p>
    </>
  );
}

const providers = { okta: "Okta", microsoft: "Microsoft Entra ID" } as const;

function InvitationOnly() {
  return (
    <p className="text-caption text-fg-tertiary">
      Preface is invitation-only. Ask an admin to invite you if you don’t have an account yet.
    </p>
  );
}
