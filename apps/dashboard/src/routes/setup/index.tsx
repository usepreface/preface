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
    defaultValues: { instanceName: "", ownerName: "", email: setup.email },
  });
  return (
    <AuthLayout
      steps={{ labels: setupSteps, current: 1 }}
      topRight="Step 1 of 3"
      aside={<InstanceAside />}
    >
      <AuthHeading title="Set up your instance">
        Name this instance and verify its owner’s email.
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
          <TextField control={form.control} name="instanceName" label="Instance name" size="lg" />
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
          <SubmitButton wide size="lg" pending={request.pending}>
            Send verification code
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
