import { Button } from "@usepreface/ui/components/button";

import { Checklist } from "#/components/data-display/checklist";
import { DetailList } from "#/components/data-display/detail-list";
import { FormDialog } from "#/components/feedback/form-dialog";
import { SubmitButton } from "#/components/form/submit-button";
import { TextareaField } from "#/components/form/text-field";
import { samlCertificateForm } from "#/forms/connections";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

const sample =
  "-----BEGIN CERTIFICATE-----\nMIIDqDCCApCgAwIBAgIGAZK1v7sEMA0GCSqGSIb3DQEBCwUAMIGUMQswCQYDVQQG…\n-----END CERTIFICATE-----";

/** Add a second signing certificate so the IdP can rotate without signing anyone out. */
export function CertificateDialog({
  open,
  onOpenChange,
  provider,
  replacing,
  onAdd,
  preview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  replacing: string;
  onAdd: (certificate: string) => void;
  preview?: boolean;
}) {
  const form = useSchemaForm(samlCertificateForm, {
    defaultValues: { certificate: preview ? sample : "" },
  });
  const pasted = form.watch("certificate").includes("BEGIN CERTIFICATE");

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Add signing certificate"
      description={`Paste ${provider}’s new certificate. Both certificates are trusted until you remove the old one.`}
      note={`Then make it primary and remove ${replacing} after ${provider} switches over.`}
      as={(content) => (
        <form
          noValidate
          className="contents"
          onSubmit={form.handleSubmit(({ certificate }) => {
            onAdd(certificate);
            onOpenChange(false);
            form.reset({ certificate: "" });
          })}
        >
          {content}
        </form>
      )}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton>Add certificate</SubmitButton>
        </>
      }
    >
      <TextareaField
        control={form.control}
        name="certificate"
        label="Certificate (PEM)"
        textareaProps={{ rows: 5, className: "font-mono text-mono-sm", spellCheck: false }}
      />
      {pasted ? (
        <>
          <DetailList
            className="rounded-xl border px-3.5"
            labelWidth="w-24"
            items={[
              { label: "Fingerprint", value: "SHA-256 B2:7E:04:…:19:AF", mono: true },
              { label: "Valid", value: "Oct 18, 2026 – Oct 18, 2029" },
              { label: "Issued by", value: `${provider} · acme.okta.com` },
            ]}
          />
          <Checklist
            checks={[
              { state: "done", title: "Valid X.509 certificate" },
              {
                state: "done",
                title: `Matches ${provider} metadata`,
                detail: "Published at acme.okta.com/app/…/metadata",
              },
            ]}
          />
        </>
      ) : null}
    </FormDialog>
  );
}
