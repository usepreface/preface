import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { DateTime } from "effect";

import type { PublicOrganizationDomain } from "@usepreface/protocol/dto";
import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { PlusIcon, GlobeIcon, TrashIcon } from "@usepreface/ui/icons";
import { NoWebsitesIllustration } from "@usepreface/ui/illustrations";

import { Permission } from "#/components/api/permission";
import { QueryState } from "#/components/api/query-state";
import { TableCard } from "#/components/data-display/table-card";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { EmptyState } from "#/components/feedback/empty-state";
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
    <SettingsFrame crumbs={[{ label: "Domains" }]} width="full">
      <PageTitle
        title="Verified domains"
        description="Verify exact email domains before trusting them for an SSO connection."
      />
      <Notice>
        Domain verification never grants membership. Bind verified claims to a connection
        explicitly.
      </Notice>
      <form
        className="flex items-start gap-2"
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
          label={<span className="sr-only">Domain</span>}
          className="w-full max-w-90 gap-0"
          leading={<GlobeIcon />}
          inputProps={{ placeholder: "company.example.com" }}
        />
        <SubmitButton pending={create.pending}>
          <PlusIcon data-icon="inline-start" />
          Add domain
        </SubmitButton>
      </form>
      <QueryState query={query}>
        {query.data?.domains.length === 0 ? (
          <EmptyState
            bordered
            art={<NoWebsitesIllustration />}
            title="No verified domains"
            description="Add a domain you own, then publish its DNS TXT record or ask an instance owner to review the exact claim."
          />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="max-lg:hidden">Verified · expiry</TableHead>
                  <TableHead className="w-0">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.domains.map((domain) => {
                  const expired =
                    domain.verifiedUntil !== null &&
                    DateTime.toEpochMillis(domain.verifiedUntil) <= Date.now();
                  return (
                    <TableRow key={domain.id}>
                      <TableCell className="font-mono text-mono-sm text-foreground">
                        {domain.domain}
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            domain.revokedAt
                              ? "neutral"
                              : domain.verifiedAt && !expired
                                ? "success"
                                : "warning"
                          }
                        >
                          <BadgeDot />
                          {domain.revokedAt
                            ? "Revoked"
                            : expired
                              ? "Expired"
                              : domain.verifiedAt
                                ? "Verified"
                                : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-fg-secondary max-lg:hidden">
                        {formatDate(domain.verifiedAt)} · {formatDate(domain.verifiedUntil)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {!domain.revokedAt ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setVerifying(domain)}
                            >
                              Verify DNS
                            </Button>
                          ) : null}
                          <Link
                            to="/instance/domains/$organizationId/$domainId"
                            params={{ organizationId: organization.id, domainId: domain.id }}
                            className="whitespace-nowrap text-sm text-fg-accent"
                          >
                            Operator review
                          </Link>
                          {!domain.revokedAt ? (
                            <Button size="sm" variant="ghost" onClick={() => setRevoking(domain)}>
                              Revoke
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        )}
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
