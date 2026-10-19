import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useAtom } from "@effect/atom-react";

import { instanceSetupRequestVerificationMutation } from "#/atoms/auth";
import { setupAtom } from "#/atoms/transient";
import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { instanceSetupForm } from "#/forms/setup";
import { toMutation } from "#/hooks/mutation";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { InstanceAside, setupSteps } from "./-components/setup-asides";

export const Route = createFileRoute("/setup/")({ component: InstanceSetup });
const useRequest = toMutation(instanceSetupRequestVerificationMutation);
function InstanceSetup() {
  const [setup, setSetup] = useAtom(setupAtom);
  const navigate = useNavigate();
  const request = useRequest();
  const { instance } = Route.useRouteContext();
  const form = useSchemaForm(instanceSetupForm, {
    defaultValues: { organizationName: "", ownerName: "", email: setup.email },
  });
  return (
    <AuthLayout
      steps={{ labels: setupSteps, current: 1 }}
      topRight="Step 1 of 2"
      aside={<InstanceAside />}
    >
      <AuthHeading title="Set up your instance">
        Name your organization and add its owner. We’ll email the owner a code to confirm it’s
        really them.
      </AuthHeading>
      {instance.state === "ready" ? (
        <Notice>
          This instance is set up. <a href="/sign-in">Sign in</a> to continue.
        </Notice>
      ) : !setup.token ? (
        <Notice tone="warning" title="Open your operator setup link">
          Use the link printed in the server logs. Reopen it if this page was refreshed.
        </Notice>
      ) : (
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            const response = await request.run({ payload: { ...values, token: setup.token } });
            if (!response) return;
            setSetup({ token: setup.token, email: values.email, challenge: response.value });
            await navigate({ to: "/setup/verify" });
          })}
        >
          <TextField
            control={form.control}
            name="organizationName"
            label="Organization name"
            description="Shown on the sign-in page and in every email Preface sends."
            size="lg"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="ownerName"
              label="Owner display name"
              size="lg"
              inputProps={{ autoComplete: "name" }}
            />
            <TextField
              control={form.control}
              name="email"
              label="Owner email"
              size="lg"
              inputProps={{ type: "email", autoComplete: "email" }}
            />
          </div>
          <SubmitButton wide arrow size="lg" pending={request.pending}>
            Send verification code
          </SubmitButton>
          <p className="text-xs text-fg-tertiary">
            No password needed. The owner signs in with email codes, Google or SSO once configured.
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
