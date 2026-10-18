import * as React from "react";

import { Button } from "@usepreface/ui/components/button";

import { Notice } from "#/components/feedback/notice";
import { samlConnectionForm } from "#/forms/connections";
import { useSchemaForm } from "#/lib/forms/use-schema-form";
import { connectionDetails, type SsoConnection } from "#/lib/placeholder";

import { CertificateDialog } from "./certificate-dialog";
import { SamlIdentityProvider, SamlServiceProvider } from "./saml-settings";

export function SamlBody({
  connection,
  rotating,
}: {
  connection: SsoConnection;
  rotating: boolean;
}) {
  const details = connectionDetails.saml;
  const [adding, setAdding] = React.useState(rotating);
  const form = useSchemaForm(samlConnectionForm, {
    defaultValues: {
      name: connection.name,
      idp: {
        entityId: details.entityId,
        signOnUrl: details.signOnUrl,
        nameIdFormat: details.nameIdFormat,
        signingCertificates: details.certificates.map((certificate) => certificate.pem),
      },
    },
  });
  const expiring = details.certificates.find((certificate) => certificate.expiring);

  return (
    <>
      {expiring ? (
        <Notice
          tone="warning"
          title={`${connection.name}’s signing certificate expires in 12 days`}
          action={
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              Rotate certificate
            </Button>
          }
        >
          Add {connection.name}’s new certificate now. Both are accepted until you remove the old
          one, so nobody is signed out.
        </Notice>
      ) : null}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <SamlIdentityProvider
          form={form}
          provider={connection.name}
          onAddCertificate={() => setAdding(true)}
        />
        <SamlServiceProvider provider={connection.name} />
      </div>
      <CertificateDialog
        open={adding}
        onOpenChange={setAdding}
        provider={connection.name}
        replacing={expiring?.name ?? "the old certificate"}
        preview={rotating}
        onAdd={(certificate) =>
          form.setValue(
            "idp.signingCertificates",
            [...form.getValues("idp.signingCertificates"), certificate],
            {
              shouldDirty: true,
            },
          )
        }
      />
    </>
  );
}
