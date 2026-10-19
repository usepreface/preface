import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useAtomSet } from "@effect/atom-react";

import { Button } from "@usepreface/ui/components/button";
import { MailIcon } from "@usepreface/ui/icons";

import {
  emailSignInRequestMutation,
  googleStartMutation,
  oidcStartMutation,
  authenticationMethodsAtom,
} from "#/atoms/auth";
import { signInAtom } from "#/atoms/transient";
import { QueryState } from "#/components/api/query-state";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { OrDivider, ProviderButton } from "#/components/auth/auth-parts";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { signInEmailForm } from "#/forms/sign-in";
import { toMutation } from "#/hooks/mutation";
import { toQuery } from "#/hooks/query";
import { useSignOut } from "#/hooks/session";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { SignInAside } from "./-components/sign-in-asides";
import { SsoOption } from "./-components/sso-option";
export const Route = createFileRoute("/sign-in/")({ component: SignIn });
const useMethods = toQuery(() => authenticationMethodsAtom);
const useEmail = toMutation(emailSignInRequestMutation);
const useGoogle = toMutation(googleStartMutation);
const useSso = toMutation(oidcStartMutation);
function SignIn() {
  const { actor, instance } = Route.useRouteContext();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const methods = useMethods();
  const email = useEmail();
  const google = useGoogle();
  const sso = useSso();
  const setSignIn = useAtomSet(signInAtom);
  const form = useSchemaForm(signInEmailForm, { defaultValues: { email: "" } });
  return (
    <AuthLayout topRight={instance.organizationName} aside={<SignInAside />}>
      {actor ? (
        <>
          <AuthHeading title="You’re signed in">Signed in as {actor.user.email}.</AuthHeading>
          <Link to="/">Continue to dashboard</Link>
          <Button variant="outline" disabled={signOut.pending} onClick={() => void signOut.run()}>
            Sign out to use another account
          </Button>
        </>
      ) : (
        <>
          <AuthHeading title={`Sign in to ${instance.organizationName}`}>
            Choose a sign-in method to continue.
          </AuthHeading>
          <QueryState query={methods}>
            {methods.data?.connections.length ? (
              <div className="flex flex-col gap-2.5">
                {methods.data.connections.map((connection) => (
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
                        params: { connectionId: connection.connectionId },
                        payload: { returnPath: "/" },
                      });
                      if (response) window.location.assign(response.value.authorizationUrl);
                    }}
                  />
                ))}
              </div>
            ) : null}
            {methods.data?.google ? (
              <ProviderButton
                brand="google"
                disabled={google.pending}
                onClick={async () => {
                  const response = await google.run({ payload: { returnPath: "/" } });
                  if (response) window.location.assign(response.value.authorizationUrl);
                }}
              >
                Continue with Google
              </ProviderButton>
            ) : null}
            {methods.data?.email ? (
              <>
                {methods.data.google || methods.data.connections.length > 0 ? <OrDivider /> : null}
                <form
                  className="flex flex-col gap-5"
                  noValidate
                  onSubmit={form.handleSubmit(async (payload) => {
                    const response = await email.run({ payload });
                    if (!response) return;
                    setSignIn({ email: payload.email, challenge: response.value });
                    await navigate({ to: "/sign-in/verify" });
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
                    }}
                  />
                  <SubmitButton wide arrow size="lg" pending={email.pending}>
                    Email me a code
                  </SubmitButton>
                </form>
              </>
            ) : null}
          </QueryState>
          <p className="text-caption text-fg-tertiary">
            Preface is invitation-only. Ask an admin to invite you if you don’t have an account yet.
          </p>
        </>
      )}
    </AuthLayout>
  );
}
