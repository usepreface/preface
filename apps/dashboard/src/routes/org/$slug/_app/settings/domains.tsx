import * as React from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { BookIcon, GlobeIcon, ShieldIcon } from "@usepreface/ui/icons";
import { NoWebsitesIllustration } from "@usepreface/ui/illustrations";

import { ConfirmDialog, ConsequenceList } from "#/components/feedback/confirm-dialog";
import { EmptyState } from "#/components/feedback/empty-state";
import { Notice } from "#/components/feedback/notice";
import { PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { domains, organizationBySlug } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { AddDomain, DomainsTable, type Domain } from "./-components/domain-list";
import { SettingsFrame } from "./-components/settings-frame";
import { VerifyDomainSheet } from "./-components/verify-domain-sheet";
export const Route = createFileRoute("/org/$slug/_app/settings/domains")({
  head: () => ({ meta: [{ title: "Domains · Settings · Preface" }] }),
  validateSearch: previewSearch,
  component: Domains,
});

/*
 * Verified domains route matching emails to the organization's SSO. `?state=verify` opens the
 * DNS challenge, `?state=revoke` the revoke confirmation and `?state=empty` no domains.
 */
function Domains() {
  const { slug } = Route.useParams();
  const state = previewState(["verify", "revoke", "empty"], Route.useSearch().state);
  const organization = organizationBySlug(slug);
  const empty = state === "empty";
  const [verifying, setVerifying] = React.useState<string | null>(
    state === "verify" ? "acme.io" : null,
  );
  const [revoking, setRevoking] = React.useState<Domain | undefined>(
    state === "revoke" ? domains[0] : undefined,
  );

  return (
    <SettingsFrame crumbs={[{ label: "Domains" }]} width="full">
      <PageTitle
        title="Verified domains"
        description={`Prove ${organization.name} owns a domain so its addresses can be routed to your SSO connection.`}
      />
      <AddDomain onAdded={setVerifying} />
      {empty ? (
        <EmptyState
          bordered
          art={<NoWebsitesIllustration />}
          title="No verified domains"
          description="Add a domain you own, publish a DNS TXT record, and Preface will route matching emails to your SSO. An instance owner approves each claim."
          actions={
            <Button variant="outline" onClick={feedback.notConnected}>
              <BookIcon data-icon="inline-start" />
              How verification works
            </Button>
          }
        />
      ) : (
        <>
          <DomainsTable onVerify={setVerifying} onRevoke={setRevoking} />
          <Notice tone="neutral" icon={ShieldIcon}>
            Instance owners approve each domain so two organizations can’t claim the same addresses.
          </Notice>
        </>
      )}
      <VerifyDomainSheet
        domain={verifying ?? ""}
        open={verifying !== null}
        onOpenChange={() => setVerifying(null)}
      />
      <ConfirmDialog
        open={revoking !== undefined}
        onOpenChange={() => setRevoking(undefined)}
        icon={GlobeIcon}
        title={`Revoke verification for ${revoking?.name ?? "this domain"}?`}
        description={`${revoking && "connection" in revoking ? revoking.connection.name : "Its connection"} stops matching ${revoking?.name} emails right away. Members with these addresses see every sign-in option again until the domain is re-verified.`}
        confirmLabel="Revoke verification"
        onConfirm={feedback.notConnected}
      >
        <ConsequenceList
          items={[
            {
              title: "The SSO connection loses its domain link",
              detail: "SSO stays required, so people pick the provider by hand.",
            },
            {
              title: "Instance approval is withdrawn",
              detail: "Another organization could then claim the domain.",
            },
          ]}
        />
      </ConfirmDialog>
    </SettingsFrame>
  );
}
