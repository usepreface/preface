import { useState } from "react";

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useAtomSet } from "@effect/atom-react";

import type { AuthenticationDiscovery } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import {
  authenticationDiscoveryDiscoverMutation,
  emailSignInRequestMutation,
  googleStartMutation,
  oidcStartMutation,
} from "#/atoms/auth";
import { signInAtom } from "#/atoms/transient";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { ProviderButton } from "#/components/auth/auth-parts";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { signInEmailForm, organizationUrlForm } from "#/forms/sign-in";
import { toMutation } from "#/hooks/mutation";
import { useSignOut } from "#/hooks/session";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { SignInAside } from "./-components/sign-in-asides";

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
  const form = useSchemaForm(signInEmailForm, { defaultValues: { email: "" } });
  const organizationForm = useSchemaForm(organizationUrlForm, {
    defaultValues: { organizationSlug: "" },
  });
  async function sendCode() {
    const values = await form.handleSubmit(async (payload) => {
      const response = await email.run({ payload });
      if (!response) return;
      setSignIn({ email: payload.email, challenge: response.value });
      await navigate({ to: "/sign-in/verify" });
    });
    await values();
  }
  return (
    <AuthLayout topRight={instance.instanceName} aside={<SignInAside />}>
      <AuthHeading title={`Sign in to ${instance.instanceName}`}>
        Use your email to find the available sign-in methods. New members need an invitation.
      </AuthHeading>
      {actor ? (
        <>
          <p className="text-sm text-fg-secondary">Signed in as {actor.user.email}.</p>
          <Link to="/organizations">Continue to your organizations</Link>
          <Button variant="outline" disabled={signOut.pending} onClick={() => void signOut.run()}>
            Sign out to use another account
          </Button>
        </>
      ) : (
        <>
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
              label="Email"
              size="lg"
              inputProps={{ type: "email", autoComplete: "email" }}
            />
            <SubmitButton wide size="lg" pending={discover.pending}>
              Continue
            </SubmitButton>
          </form>
          {methods ? (
            <div className="flex flex-col gap-3">
              {methods.connections.map((connection) => (
                <Button
                  key={connection.connectionId}
                  variant="outline"
                  disabled={sso.pending}
                  onClick={async () => {
                    const response = await sso.run({
                      params: {
                        organizationId: connection.organizationId,
                        connectionId: connection.connectionId,
                      },
                      payload: { returnPath: "/organizations" },
                    });
                    if (response) window.location.assign(response.value.authorizationUrl);
                  }}
                >
                  Continue with {connection.name}
                </Button>
              ))}
              {methods.google ? (
                <ProviderButton
                  brand="google"
                  disabled={google.pending}
                  onClick={async () => {
                    const response = await google.run({
                      payload: { returnPath: "/organizations" },
                    });
                    if (response) window.location.assign(response.value.authorizationUrl);
                  }}
                >
                  Continue with Google
                </ProviderButton>
              ) : null}
              {methods.email ? (
                <Button disabled={email.pending} onClick={() => void sendCode()}>
                  Email me a code
                </Button>
              ) : null}
              <form
                className="flex flex-col gap-3 border-t pt-4"
                onSubmit={organizationForm.handleSubmit(async (payload) => {
                  const response = await discover.run({
                    payload: { ...payload, email: form.getValues("email") },
                  });
                  if (response) setMethods(response.value);
                })}
              >
                <TextField
                  control={organizationForm.control}
                  name="organizationSlug"
                  label="Organization URL slug"
                  description="Enter your organization’s slug if its SSO is missing above."
                />
                <SubmitButton pending={discover.pending}>Find organization</SubmitButton>
              </form>
            </div>
          ) : null}
        </>
      )}
    </AuthLayout>
  );
}
