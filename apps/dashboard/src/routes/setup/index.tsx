import * as React from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AuthHeading, AuthLayout } from "#/components/auth/auth-layout";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { instanceSetupForm } from "#/forms/setup";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { placeholder } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { InstanceAside, setupSteps } from "./-components/setup-asides";

export const Route = createFileRoute("/setup/")({
  head: () => ({ meta: [{ title: "Set up your instance · Preface" }] }),
  validateSearch: previewSearch,
  component: InstanceSetup,
});

/** Step 1: name the instance and add its owner. `?state=invalid` shows the validation state. */
function InstanceSetup() {
  const navigate = useNavigate();
  const invalid = previewState(["invalid"], Route.useSearch().state) === "invalid";
  const form = useSchemaForm(instanceSetupForm, {
    defaultValues: invalid
      ? {
          instanceName: placeholder.instance.name,
          ownerName: placeholder.owner.name,
          email: "aisha@acme",
        }
      : { instanceName: "", ownerName: "", email: "" },
  });

  React.useEffect(() => {
    if (invalid) void form.trigger();
  }, [invalid, form]);

  return (
    <AuthLayout
      steps={{ labels: setupSteps, current: 1 }}
      topRight="Step 1 of 3"
      aside={<InstanceAside />}
    >
      <AuthHeading title="Set up your instance">
        Name this Preface instance and add its owner. We’ll email the owner a code to confirm it’s
        really them.
      </AuthHeading>
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={form.handleSubmit(() => navigate({ to: "/setup/verify" }))}
      >
        <TextField
          control={form.control}
          name="instanceName"
          label="Instance name"
          description="Shown on the sign-in page and in every email Preface sends."
          size="lg"
          inputProps={{ placeholder: "Acme Knowledge", autoFocus: true }}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="ownerName"
            label="Owner display name"
            size="lg"
            inputProps={{ placeholder: "Aisha Khan", autoComplete: "name" }}
          />
          <TextField
            control={form.control}
            name="email"
            label="Owner email"
            size="lg"
            inputProps={{ type: "email", placeholder: "name@acme.dev", autoComplete: "email" }}
          />
        </div>
        <Notice tone="neutral">
          The owner can’t be removed later, only transferred. Use an address you’ll keep.
        </Notice>
        <SubmitButton
          size="lg"
          wide
          arrow
          pending={form.formState.isSubmitting}
          pendingLabel="Sending code…"
        >
          Send verification code
        </SubmitButton>
      </form>
      <p className="text-caption text-fg-tertiary">
        No password needed. The owner signs in with email codes, Google or SSO once an organization
        adds it.
      </p>
    </AuthLayout>
  );
}
