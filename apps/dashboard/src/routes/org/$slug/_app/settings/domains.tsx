import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import type { PublicOrganizationDomain } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { SubmitButton } from "#/components/form/submit-button";
import { TextField } from "#/components/form/text-field";
import { PageTitle } from "#/components/shell/page";
import { domainForm } from "#/forms/domains";
import { useOrganizationDomainsCreate, useOrganizationDomainsRevoke } from "#/hooks/identity";
import { useOrganization, useDomains } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";
import { useSchemaForm } from "#/lib/forms/use-schema-form";

import { SettingsFrame } from "./-components/settings-frame";
import { VerifyDomainSheet } from "./-components/verify-domain-sheet";

export const Route = createFileRoute("/org/$slug/_app/settings/domains")({
  component: () => (
    <Permission owner>
      <Domains />
    </Permission>
  ),
});
function Domains() {
  const { organization } = useOrganization();
  const query = useDomains(organization.id);
  const create = useOrganizationDomainsCreate();
  const revoke = useOrganizationDomainsRevoke();
  const form = useSchemaForm(domainForm, { defaultValues: { domain: "" } });
  const [verifying, setVerifying] = useState<typeof PublicOrganizationDomain.Type>();
  const [revoking, setRevoking] = useState<typeof PublicOrganizationDomain.Type>();
  return (
    <SettingsFrame crumbs={[{ label: "Domains" }]}>
      <PageTitle
        title="Domains"
        description="Verify exact email domains before trusting them for an SSO connection."
      />
      <Notice>
        Domain verification never grants membership. Bind verified claims to a connection
        explicitly.
      </Notice>
      <form
        className="flex flex-col gap-4 rounded-xl border p-5"
        onSubmit={form.handleSubmit(async (payload) => {
          const response = await create.run({
            params: { organizationId: organization.id },
            payload,
          });
          if (response) {
            form.reset();
            setVerifying(response.value);
          }
        })}
      >
        <TextField
          control={form.control}
          name="domain"
          label="Domain"
          inputProps={{ placeholder: "company.example.com" }}
        />
        <SubmitButton pending={create.pending}>Add domain</SubmitButton>
      </form>
      <QueryState query={query}>
        <div className="flex flex-col gap-3">
          {query.data?.domains.map((domain) => (
            <article
              key={domain.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
            >
              <div className="flex-1">
                <h2 className="text-sm font-medium">{domain.domain}</h2>
                <p className="text-xs text-fg-tertiary">
                  {domain.revokedAt
                    ? "Revoked"
                    : domain.verifiedAt
                      ? `Verified by ${domain.verificationMethod} until ${formatDate(domain.verifiedUntil)}`
                      : "Unverified"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setVerifying(domain)}>
                Verify DNS
              </Button>
              <Link
                to="/instance/domains/$organizationId/$domainId"
                params={{ organizationId: organization.id, domainId: domain.id }}
                className="text-sm text-fg-accent"
              >
                Operator review
              </Link>
              {!domain.revokedAt ? (
                <Button size="sm" variant="ghost" onClick={() => setRevoking(domain)}>
                  Revoke
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </QueryState>
      {verifying ? (
        <VerifyDomainSheet domain={verifying} onClose={() => setVerifying(undefined)} />
      ) : null}
      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => {
          if (!open) setRevoking(undefined);
        }}
        pending={revoke.pending}
        icon={TrashIcon}
        title="Revoke domain claim?"
        description="Connections lose the authority supplied by this claim."
        confirmLabel="Revoke claim"
        onConfirm={async () => {
          if (
            revoking &&
            (await revoke.run({
              params: { organizationId: organization.id, domainId: revoking.id },
              payload: { expectedRevision: revoking.revision },
            }))
          )
            setRevoking(undefined);
        }}
      />
    </SettingsFrame>
  );
}
