import * as React from "react";

import { SecretField, CopyField } from "#/components/data-display/copy-field";
import { SaveBar } from "#/components/form/save-bar";
import { SelectField } from "#/components/form/select-field";
import { TextField } from "#/components/form/text-field";
import { SectionCard } from "#/components/shell/section-card";
import { oidcConnectionForm } from "#/forms/connections";
import { feedback } from "#/lib/feedback";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { connectionDetails, type SsoConnection } from "#/lib/placeholder";
import { instanceUrl } from "#/lib/urls";

const methods = [
  { value: "client_secret_post", label: "client_secret_post" },
  { value: "client_secret_basic", label: "client_secret_basic" },
] as const;

/** The OIDC client registration, and the callback URL to paste into the provider. */
export function OidcSettings({ connection }: { connection: SsoConnection }) {
  const details = connectionDetails.oidc;
  const draft = connection.status === "draft";
  const [replacing, setReplacing] = React.useState(draft);
  const form = useSchemaForm(oidcConnectionForm, {
    defaultValues: draft
      ? { name: connection.name, clientAuthenticationMethod: "client_secret_post" }
      : {
          name: connection.name,
          issuer: details.issuer,
          clientId: details.clientId,
          clientAuthenticationMethod: details.clientAuthenticationMethod,
        },
  });

  return (
    <>
      <SectionCard
        title="Identity provider"
        description={`From your ${connection.name} app registration.`}
      >
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(() => {
            feedback.saved("Connection");
            form.reset(form.getValues());
            setReplacing(false);
          })}
        >
          <TextField control={form.control} name="name" label="Connection name" />
          <TextField
            control={form.control}
            name="issuer"
            label="Issuer URL"
            emptyAsUndefined
            inputProps={{
              placeholder: "https://login.microsoftonline.com/…/v2.0",
              className: "font-mono text-mono-sm",
            }}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              control={form.control}
              name="clientId"
              label="Client ID"
              emptyAsUndefined
              inputProps={{ className: "font-mono text-mono-sm" }}
            />
            {replacing ? (
              <TextField
                control={form.control}
                name="clientSecret"
                label="Client secret"
                emptyAsUndefined
                description={draft ? undefined : "Leave empty to keep the saved secret."}
                inputProps={{ type: "password", autoComplete: "off" }}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Client secret</span>
                <SecretField
                  hint={details.secretHint}
                  label="client secret"
                  onReplace={() => setReplacing(true)}
                />
              </div>
            )}
          </div>
          <SelectField
            control={form.control}
            name="clientAuthenticationMethod"
            label="Client authentication"
            description={`How Preface proves itself to ${connection.name} when exchanging the code.`}
            options={methods}
          />
          <SaveBar
            dirty={form.formState.isDirty}
            pending={form.formState.isSubmitting}
            onReset={() => {
              form.reset();
              setReplacing(draft);
            }}
          />
        </form>
      </SectionCard>
      <SectionCard
        title="Preface details"
        description={`Paste this into ${connection.name} → Authentication → Redirect URIs.`}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-13 text-fg-secondary">Callback URL</span>
          <CopyField value={instanceUrl(details.callbackPath)} label="Callback URL" />
        </div>
      </SectionCard>
    </>
  );
}
