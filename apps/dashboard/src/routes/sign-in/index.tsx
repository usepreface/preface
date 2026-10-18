import { useState } from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useAtomSet } from "@effect/atom-react";

import type { AuthenticationDiscovery } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { MailIcon } from "@usepreface/ui/icons";

import {
  authenticationDiscoveryDiscoverMutation,
  emailSignInRequestMutation,
  googleStartMutation,
  oidcStartMutation,
} from "#/atoms/auth";
import { signInAtom } from "#/atoms/transient";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { EmailRecipient, OrDivider, ProviderButton } from "#/components/auth/auth-parts";
import { SlugField } from "#/components/form/slug-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { signInEmailForm, organizationUrlForm } from "#/forms/sign-in";
import { toMutation } from "#/hooks/mutation";
import { useSignOut } from "#/hooks/session";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { organizationUrlPrefix } from "#/lib/urls";

import { SignInAside } from "./-components/sign-in-asides";
import { SsoOption } from "./-components/sso-option";

export const Route = createFileRoute("/sign-in/")({ component: SignIn });

const useDiscover = toMutation(authenticationDiscoveryDiscoverMutation);
const useEmail = toMutation(emailSignInRequestMutation);
const useGoogle = toMutation(googleStartMutation);
const useSso = toMutation(oidcStartMutation);

function SignIn() {
  const { actor, instance } = Route.useRouteContext();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const discover = useDiscover();
  const email = useEmail();
  const google = useGoogle();
  const sso = useSso();
  const setSignIn = useAtomSet(signInAtom);
  const [methods, setMethods] = useState<typeof AuthenticationDiscovery.Type>();
  const [findingOrganization, setFindingOrganization] = useState(false);
  const form = useSchemaForm(signInEmailForm, { defaultValues: { email: "" } });
  const organizationForm = useSchemaForm(organizationUrlForm, {
    defaultValues: { organizationSlug: "" },
  });

  async function sendCode() {
    await form.handleSubmit(async (payload) => {
      const response = await email.run({ payload });
      if (!response) return;
      setSignIn({ email: payload.email, challenge: response.value });
      await navigate({ to: "/sign-in/verify" });
    })();
  }

  function changeEmail() {
    setMethods(undefined);
    setFindingOrganization(false);
  }

  return (
    <AuthLayout topRight={instance.instanceName} aside={<SignInAside />}>
      {actor ? (
        <>
          <AuthHeading title="You’re signed in">Signed in as {actor.user.email}.</AuthHeading>
          <Link to="/organizations">Continue to your organizations</Link>
          <Button variant="outline" disabled={signOut.pending} onClick={() => void signOut.run()}>
            Sign out to use another account
          </Button>
        </>
      ) : !methods ? (
        <>
          <AuthHeading title={`Sign in to ${instance.instanceName}`}>
            Use your work email. We’ll show the sign-in options your organization allows.
          </AuthHeading>
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={form.handleSubmit(async (payload) => {
              const response = await discover.run({ payload });
              if (response) setMethods(response.value);
            })}
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
              }}
            />
            <SubmitButton
              wide
              arrow
              size="lg"
              pending={discover.pending}
              pendingLabel="Checking sign-in options…"
            >
              Continue
            </SubmitButton>
          </form>
          <p className="text-caption text-fg-tertiary">
            Preface is invitation-only. Ask an admin to invite you if you don’t have an account yet.
          </p>
        </>
      ) : findingOrganization ? (
        <>
          <AuthHeading title="Find your organization">
            Enter your organization’s URL to find its single sign-on.
          </AuthHeading>
          <EmailRecipient
            email={form.getValues("email")}
            actionLabel="Change"
            onAction={changeEmail}
          />
          <form
            className="flex flex-col gap-5"
            noValidate
            onSubmit={organizationForm.handleSubmit(async (payload) => {
              const response = await discover.run({
                payload: { ...payload, email: form.getValues("email") },
              });
              if (response) {
                setMethods(response.value);
                setFindingOrganization(false);
              }
            })}
          >
            <SlugField
              control={organizationForm.control}
              name="organizationSlug"
              label="Organization URL"
              prefix={organizationUrlPrefix}
              description="The part after /org/ in your organization’s address."
            />
            <SubmitButton wide arrow size="lg" pending={discover.pending}>
              Find organization
            </SubmitButton>
          </form>
          <OrDivider />
          {methods.email ? (
            <Button
              variant="outline"
              size="lg"
              disabled={email.pending}
              onClick={() => void sendCode()}
            >
              <MailIcon data-icon="inline-start" />
              Email me a code instead
            </Button>
          ) : null}
          <p className="text-caption text-fg-tertiary">
            Your organization’s URL is in invitation emails and in the address bar once you’re
            signed in.
          </p>
        </>
      ) : (
        <>
          <AuthHeading title="Choose how to sign in">
            Pick an available sign-in method for your account.
          </AuthHeading>
          <EmailRecipient
            email={form.getValues("email")}
            actionLabel="Change"
            onAction={changeEmail}
          />
          {methods.connections.length ? (
            <div className="flex flex-col gap-2.5">
              {methods.connections.map((connection) => (
                <SsoOption
                  key={connection.connectionId}
                  title={`Continue with ${connection.name}`}
                  detail={
                    connection.provider === "saml"
                      ? "SAML single sign-on"
                      : "OpenID Connect single sign-on"
                  }
                  disabled={sso.pending}
                  onSelect={async () => {
                    const response = await sso.run({
                      params: {
                        organizationId: connection.organizationId,
                        connectionId: connection.connectionId,
                      },
                      payload: { returnPath: "/organizations" },
                    });
                    if (response) window.location.assign(response.value.authorizationUrl);
                  }}
                />
              ))}
            </div>
          ) : null}
          {methods.connections.length && (methods.google || methods.email) ? <OrDivider /> : null}
          {methods.google ? (
            <ProviderButton
              brand="google"
              disabled={google.pending}
              onClick={async () => {
                const response = await google.run({ payload: { returnPath: "/organizations" } });
                if (response) window.location.assign(response.value.authorizationUrl);
              }}
            >
              Continue with Google
            </ProviderButton>
          ) : null}
          {methods.email ? (
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled={email.pending}
              onClick={() => void sendCode()}
            >
              <MailIcon data-icon="inline-start" />
              Email me a code
            </Button>
          ) : null}
          <Button variant="link" onClick={() => setFindingOrganization(true)}>
            Find your organization
          </Button>
        </>
      )}
    </AuthLayout>
  );
}
