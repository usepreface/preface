import { Redacted } from "effect";

import type { PublicOidcConnection } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import { CopyField } from "#/components/data-display/copy-field";
import { SelectField } from "#/components/form/select-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { oidcConnectionForm } from "#/forms/connections";
import { useOrganizationIdentityConnectionsUpdate } from "#/hooks/identity";
import { feedback } from "#/lib/feedback";
import { useRevisionForm } from "#/lib/forms/use-revision-form";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function OidcSettings({ connection }: { connection: typeof PublicOidcConnection.Type }) {
  const update = useOrganizationIdentityConnectionsUpdate();
  const savedValues = {
    name: connection.name,
    issuer: connection.configuration.issuer,
    clientId: connection.configuration.clientId,
    clientAuthenticationMethod: connection.configuration.clientAuthenticationMethod,
  };
  const form = useSchemaForm(oidcConnectionForm, {
    defaultValues: savedValues,
  });
  const version = useRevisionForm(form, connection.revision, savedValues);
  return (
    <form
      className="flex flex-col gap-5 rounded-xl border p-5"
      onSubmit={form.handleSubmit(async (values) => {
        const response = await update.run({
          params: { organizationId: connection.organizationId, connectionId: connection.id },
          payload: {
            expectedRevision: version.revision,
            ...(form.formState.dirtyFields.name ? { name: values.name } : {}),
            ...(form.formState.dirtyFields.issuer ? { issuer: values.issuer } : {}),
            ...(form.formState.dirtyFields.clientId ? { clientId: values.clientId } : {}),
            ...(form.formState.dirtyFields.clientAuthenticationMethod
              ? { clientAuthenticationMethod: values.clientAuthenticationMethod }
              : {}),
            ...(values.clientSecret ? { clientSecret: Redacted.value(values.clientSecret) } : {}),
          },
        });
        if (response) {
          version.accept(response.value.revision, { ...form.getValues(), clientSecret: undefined });
          feedback.saved("Connection");
        }
      })}
    >
      <h2 className="text-base font-semibold">OIDC settings</h2>
      <TextField control={form.control} name="name" label="Connection name" />
      <TextField
        control={form.control}
        name="issuer"
        label="Issuer URL"
        inputProps={{ disabled: Boolean(connection.activatedAt) }}
      />
      <TextField
        control={form.control}
        name="clientId"
        label="Client ID"
        inputProps={{ disabled: Boolean(connection.activatedAt) }}
      />
      <TextField
        control={form.control}
        name="clientSecret"
        label="Replacement client secret"
        optional
        emptyAsUndefined
        inputProps={{ type: "password", autoComplete: "new-password" }}
        description={
          connection.hasClientSecret
            ? "A secret is stored. Leave this empty to keep it."
            : "No client secret is stored."
        }
      />
      <SelectField
        control={form.control}
        name="clientAuthenticationMethod"
        label="Client authentication"
        options={[
          { value: "client_secret_basic", label: "Client secret basic" },
          { value: "client_secret_post", label: "Client secret post" },
        ]}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Callback URL</span>
        <CopyField label="OIDC callback URL" value={connection.callbackUrl} />
      </div>
      <Button type="button" variant="outline" onClick={version.reload}>
        Reload saved settings
      </Button>
      {version.conflicted ? (
        <p role="alert" className="text-sm text-warning-fg">
          Saved settings changed. Reload them before saving your edits.
        </p>
      ) : null}
      <SubmitButton pending={update.pending}>Save connection</SubmitButton>
    </form>
  );
}
