import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { DownloadIcon, FileIcon, PlusIcon, TrashIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { CopyField } from "#/components/data-display/copy-field";
import { FormField } from "#/components/form/form-field";
import { SaveBar } from "#/components/form/save-bar";
import { SelectField } from "#/components/form/select-field";
import { TextField } from "#/components/form/text-field";
import { SectionCard } from "#/components/shell/section-card";
import type { samlConnectionForm } from "#/forms/connections";
import { feedback } from "#/lib/feedback";
import type { SchemaForm } from "#/lib/forms/use-schema-form";
import { connectionDetails } from "#/lib/placeholder";
import { instanceUrl } from "#/lib/urls";

const nameIdFormats = [
  {
    value: "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
    label: "Unspecified (SAML 1.1)",
  },
  { value: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent", label: "Persistent (SAML 2.0)" },
] as const;

/** The IdP side of a SAML connection: entity ID, sign-on URL, NameID format and certificates. */
export function SamlIdentityProvider({
  form,
  provider,
  onAddCertificate,
}: {
  form: SchemaForm<typeof samlConnectionForm>;
  provider: string;
  onAddCertificate: () => void;
}) {
  const known = connectionDetails.saml.certificates;
  return (
    <SectionCard title="Identity provider" description={`From the ${provider} app’s SAML setup.`}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(() => {
          feedback.saved("Connection");
          form.reset(form.getValues());
        })}
      >
        <TextField
          control={form.control}
          name="idp.entityId"
          label="IdP entity ID"
          inputProps={{ className: "font-mono text-mono-sm" }}
        />
        <TextField
          control={form.control}
          name="idp.signOnUrl"
          label="Sign-on URL"
          inputProps={{ className: "font-mono text-mono-sm" }}
        />
        <SelectField
          control={form.control}
          name="idp.nameIdFormat"
          label="NameID format"
          options={nameIdFormats}
        />
        <FormField
          control={form.control}
          name="idp.signingCertificates"
          label="Signing certificates"
        >
          {({ field, describedBy }) => {
            const certificates: readonly string[] = field.value ?? [];
            return (
              <div className="flex flex-col gap-2" aria-describedby={describedBy}>
                {certificates.map((pem, index) => {
                  const info = known[index] ?? {
                    name: `certificate-${index + 1}.pem`,
                    fingerprint: "SHA-256 B2:7E:04:…:19:AF",
                    expires: "Expires Oct 2029",
                    expiring: false,
                  };
                  return (
                    <div
                      key={pem.slice(-48) + index}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                        info.expiring ? "border-warning/60 bg-warning-bg" : null,
                      )}
                    >
                      <FileIcon className="size-4.5 shrink-0 text-icon-secondary" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                          {info.name}
                          {index === 0 ? (
                            <Badge variant="outline">Primary</Badge>
                          ) : (
                            <Badge tone="info">New</Badge>
                          )}
                        </span>
                        <span className="truncate font-mono text-2xs text-fg-tertiary">
                          {info.fingerprint}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-caption font-medium",
                          info.expiring ? "text-warning-fg" : "text-fg-secondary",
                        )}
                      >
                        {info.expires}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${info.name}`}
                        disabled={certificates.length === 1}
                        onClick={() => field.onChange(certificates.filter((_, i) => i !== index))}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start text-fg-accent"
                  onClick={onAddCertificate}
                  disabled={certificates.length >= 5}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add certificate
                </Button>
              </div>
            );
          }}
        </FormField>
        <SaveBar
          dirty={form.formState.isDirty}
          pending={form.formState.isSubmitting}
          onReset={() => form.reset()}
        />
      </form>
    </SectionCard>
  );
}

/** Preface's side of a SAML connection, to paste into the IdP. */
export function SamlServiceProvider({ provider }: { provider: string }) {
  const { sp } = connectionDetails.saml;
  const fields = [
    ["Entity ID", instanceUrl(sp.entityPath)],
    ["ACS URL", instanceUrl(sp.acsPath)],
    ["Metadata URL", instanceUrl(sp.metadataPath)],
  ] as const;
  return (
    <SectionCard title="Preface (service provider)" description={`Give these to ${provider}.`}>
      {fields.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span className="text-13 text-fg-secondary">{label}</span>
          <CopyField value={value} label={label} />
        </div>
      ))}
      <div className="flex items-center gap-2 border-t pt-3">
        <span className="flex-1 text-13 text-fg-secondary">SP certificate · valid until 2028</span>
        <Button variant="ghost" size="sm" onClick={feedback.notConnected}>
          <DownloadIcon data-icon="inline-start" />
          Download
        </Button>
      </div>
    </SectionCard>
  );
}
