import type { PublicSamlConnection } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import { CopyField } from "#/components/data-display/copy-field";
import { SelectField } from "#/components/form/select-field";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField, TextareaField } from "#/components/form/text-field";
import { samlConnectionForm } from "#/forms/connections";
import { useOrganizationIdentityConnectionsUpdateSaml } from "#/hooks/identity";
import { feedback } from "#/lib/feedback";
import { useRevisionForm } from "#/lib/forms/use-revision-form";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

export function SamlSettings({ connection }: { connection: typeof PublicSamlConnection.Type }) {
  const update = useOrganizationIdentityConnectionsUpdateSaml();
  const idp = connection.configuration.idp;
  const savedValues = {
    name: connection.name,
    idp: {
      entityId: idp?.entityId ?? "",
      signOnUrl: idp?.signOnUrl ?? "",
      signingCertificates: [...(idp?.signingCertificates ?? [""])],
      nameIdFormat: idp?.nameIdFormat ?? "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
      emailAttribute: idp?.emailAttribute,
    },
  };
  const form = useSchemaForm(samlConnectionForm, {
    defaultValues: savedValues,
  });
  const version = useRevisionForm(form, connection.revision, savedValues);
  const certificates = form.watch("idp.signingCertificates");
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-xl border p-5">
        <h2 className="text-base font-semibold">Service provider</h2>
        <p className="text-sm text-fg-secondary">
          Import this metadata into your IdP. Require signed Response and Assertion.
        </p>
        <CopyField label="SP entity ID" value={connection.configuration.entityId} />
        <CopyField label="ACS URL" value={connection.configuration.callbackUrl} />
        <CopyField label="SP metadata URL" value={connection.metadataUrl} />
        <a
          className="text-sm text-fg-accent"
          href={connection.metadataUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open SP metadata
        </a>
        <details>
          <summary className="cursor-pointer text-sm">Current signing certificate</summary>
          <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
            {connection.configuration.signingCertificate}
          </pre>
        </details>
      </section>
      <form
        className="flex flex-col gap-5 rounded-xl border p-5"
        onSubmit={form.handleSubmit(async (values) => {
          const response = await update.run({
            params: { connectionId: connection.id },
            payload: {
              expectedRevision: version.revision,
              ...(form.formState.dirtyFields.name ? { name: values.name } : {}),
              ...(Object.keys(form.formState.dirtyFields.idp ?? {}).length > 0
                ? { idp: values.idp }
                : {}),
            },
          });
          if (response) {
            version.accept(response.value.revision, form.getValues());
            feedback.saved("SAML connection");
          }
        })}
      >
        <h2 className="text-base font-semibold">Identity provider</h2>
        <TextField control={form.control} name="name" label="Connection name" />
        <TextField
          control={form.control}
          name="idp.entityId"
          label="IdP entity ID"
          inputProps={{ disabled: Boolean(connection.activatedAt) }}
        />
        <TextField control={form.control} name="idp.signOnUrl" label="Sign-on URL" />
        <SelectField
          control={form.control}
          name="idp.nameIdFormat"
          label="NameID format"
          disabled={Boolean(connection.activatedAt)}
          options={[
            { value: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent", label: "Persistent" },
            {
              value: "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
              label: "Unspecified (stable value required)",
            },
          ]}
        />
        <TextField
          control={form.control}
          name="idp.emailAttribute"
          label="Email attribute"
          optional
          emptyAsUndefined
          description="Optional assertion attribute used for first-time verified enrollment."
        />
        {certificates.map((certificate, index) => (
          <div key={index} className="flex flex-col gap-2">
            <TextareaField
              control={form.control}
              name={`idp.signingCertificates.${index}`}
              label={`IdP signing certificate ${index + 1}`}
              textareaProps={{ rows: 5, spellCheck: false }}
            />
            {certificates.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  form.setValue(
                    "idp.signingCertificates",
                    certificates.filter((candidate, position) => position !== index),
                    { shouldDirty: true },
                  )
                }
              >
                Remove certificate
              </Button>
            ) : null}
          </div>
        ))}
        {certificates.length < 5 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.setValue("idp.signingCertificates", [...certificates, ""], { shouldDirty: true })
            }
          >
            Add signing certificate
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={version.reload}>
          Reload saved settings
        </Button>
        {version.conflicted ? (
          <p role="alert" className="text-sm text-warning-fg">
            Saved settings changed. Reload them before saving your edits.
          </p>
        ) : null}
        <SubmitButton pending={update.pending}>Save identity provider</SubmitButton>
      </form>
    </div>
  );
}
