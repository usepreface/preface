import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { Label } from "@usepreface/ui/components/label";
import { CheckCircleIcon, MailIcon, ShieldIcon } from "@usepreface/ui/icons";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { ProviderButton } from "#/components/auth/auth-parts";
import { Person } from "#/components/data-display/identity";
import { Notice } from "#/components/feedback/notice";
import { TextField } from "#/components/form/text-field";
import { acceptInvitationForm } from "#/forms/invitation";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { invitation } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { InvitationDetails, InvitationOrgCard } from "./-components/invitation-parts";
import { AccountMismatch, InvitationClosed } from "./-components/invitation-problems";
export const Route = createFileRoute("/invitations/accept")({
  head: () => ({ meta: [{ title: `Join ${invitation.organization.name} · Preface` }] }),
  validateSearch: previewSearch,
  component: AcceptInvitation,
});

const states = ["sso", "signed-in", "mismatch", "expired", "revoked"] as const;

/*
 * The link in an invitation email. Signup is invitation-only, so this is the only way new people
 * get an account. `?state=` previews SSO-only organizations, a signed-in visitor, the wrong
 * account, and expired or revoked invitations.
 */
function AcceptInvitation() {
  const state = previewState(states, Route.useSearch().state);
  if (state === "mismatch") return <AccountMismatch />;
  if (state === "expired" || state === "revoked") return <InvitationClosed kind={state} />;

  const { organization, invitedBy } = invitation;
  return (
    <AuthLayout
      topRight={`Invitation · expires ${invitation.expires}`}
      aside={<InvitationOrgCard />}
    >
      <AuthHeading title={`Join ${organization.name} on Preface`}>
        {invitedBy.name} invited you to {organization.name}’s knowledge base. Review the invitation
        and choose how to sign in.
      </AuthHeading>
      <InvitationDetails />
      {state === "signed-in" ? <SignedInJoin /> : state === "sso" ? <SsoJoin /> : <ChooseMethod />}
    </AuthLayout>
  );
}

function ChooseMethod() {
  const form = useSchemaForm(acceptInvitationForm, { defaultValues: { displayName: "" } });
  const sendCode = form.handleSubmit(() =>
    feedback.sent("Code sent", `Check ${invitation.email}.`),
  );
  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={sendCode}>
      <TextField
        control={form.control}
        name="displayName"
        label="Display name"
        description="How teammates see you in Preface."
        size="lg"
        inputProps={{ placeholder: "Marco Rossi", autoComplete: "name", autoFocus: true }}
      />
      <div className="flex flex-col gap-2.5">
        <Label>Continue with</Label>
        <ProviderButton brand="okta" onClick={form.handleSubmit(feedback.notConnected)}>
          Okta · Acme SSO
        </ProviderButton>
        <ProviderButton brand="google" onClick={form.handleSubmit(feedback.notConnected)}>
          Google
        </ProviderButton>
        <Button type="submit" size="lg" className="w-full">
          <MailIcon data-icon="inline-start" />
          Email me a code
        </Button>
      </div>
      <p className="text-caption text-fg-tertiary">
        Accepting creates your account. Okta and Google join you directly. The invitation stays tied
        to {invitation.email}.
      </p>
    </form>
  );
}

function SsoJoin() {
  return (
    <>
      <Notice tone="info" icon={ShieldIcon} title="Single sign-on required">
        Acme requires Okta for everyone. You’ll join straight through Okta, no separate Preface
        account or email code needed.
      </Notice>
      <ProviderButton brand="okta" variant="default" onClick={feedback.notConnected}>
        Continue with Okta
      </ProviderButton>
      <p className="text-caption text-fg-tertiary">
        Okta shares your name when you sign in. Signing in accepts the invitation and joins Acme
        with the roles above.
      </p>
    </>
  );
}

function SignedInJoin() {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border bg-surface-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <Person name="Marco Rossi" detail={`Signed in as ${invitation.email}`} />
        </div>
        <CheckCircleIcon className="size-4.5 text-success-fg" aria-label="Email matches" />
      </div>
      <Button
        size="lg"
        className="w-full"
        onClick={() =>
          navigate({ to: "/org/$slug", params: { slug: invitation.organization.slug } })
        }
      >
        Join {invitation.organization.name}
      </Button>
      <Button variant="ghost" className="w-full" onClick={feedback.notConnected}>
        Decline invitation
      </Button>
    </>
  );
}
