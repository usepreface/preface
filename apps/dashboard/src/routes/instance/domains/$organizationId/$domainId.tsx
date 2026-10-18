import * as React from "react";

import { createFileRoute, notFound } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { CheckCircleIcon, CheckIcon, GlobeIcon, InfoIcon } from "@usepreface/ui/icons";

import { Checklist } from "#/components/data-display/checklist";
import { DetailList } from "#/components/data-display/detail-list";
import { IconTile } from "#/components/data-display/icon-tile";
import { StatusBadge } from "#/components/data-display/status-badge";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { OrgAvatar } from "#/components/organization/org-avatar";
import { PageTitle } from "#/components/shell/page";
import { SectionCard } from "#/components/shell/section-card";
import { feedback } from "#/lib/feedback";
import { domainClaims, organizationBySlug } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";
import { domainApproval } from "#/lib/status";

import { InstancePage } from "../../-components/instance-page";

export const Route = createFileRoute("/instance/domains/$organizationId/$domainId")({
  head: () => ({ meta: [{ title: "Domain claim · Instance · Preface" }] }),
  validateSearch: previewSearch,
  loader: ({ params }) => {
    const claim = domainClaims.find(
      (candidate) =>
        candidate.organization === params.organizationId && candidate.domain === params.domainId,
    );
    if (!claim) throw notFound();
    return claim;
  },
  component: DomainClaim,
});

/*
 * One organization's claim on a domain. Approving routes the domain's emails to that
 * organization's SSO. `?state=approved` and `?state=pending` force either side.
 */
function DomainClaim() {
  const claim = Route.useLoaderData();
  const state = previewState(["approved", "pending"], Route.useSearch().state);
  const approved = state ? state === "approved" : claim.approved;
  const organization = organizationBySlug(claim.organization);
  const [dialog, setDialog] = React.useState<"approve" | "reject" | "withdraw" | null>(null);
  const subdomain = claim.domain.split(".").length > 2;

  return (
    <InstancePage
      crumbs={[{ label: "Domain claims" }, { label: claim.domain }]}
      actions={
        approved ? (
          <Button variant="destructive-outline" onClick={() => setDialog("withdraw")}>
            Withdraw approval
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setDialog("reject")}>
              Reject
            </Button>
            <Button onClick={() => setDialog("approve")}>
              <CheckIcon data-icon="inline-start" />
              Approve claim
            </Button>
          </>
        )
      }
    >
      <PageTitle
        leading={<IconTile icon={GlobeIcon} />}
        title={claim.domain}
        badges={<StatusBadge status={domainApproval[approved ? "approved" : "awaiting"]} />}
        description={`Claimed by ${organization.name} on ${claim.requested} · requested by ${claim.requestedBy.split(" · ")[0]}`}
      />
      {approved ? (
        <Notice tone="success" icon={CheckCircleIcon} title={`Approved on Oct 18 by Aisha Khan`}>
          Emails at {claim.domain} now go to {organization.name}’s{" "}
          {claim.connection.split(" · ")[0]} connection on this instance.
        </Notice>
      ) : (
        <Notice
          tone="info"
          icon={InfoIcon}
          title={`Approving routes ${claim.domain} to ${organization.name}`}
        >
          Anyone signing in with an {claim.domain} email will be sent to {organization.name}’s{" "}
          {claim.connection.split(" · ")[0]}. Only one organization can hold a domain.
        </Notice>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Claim">
          <DetailList
            labelWidth="w-36"
            items={[
              {
                label: "Organization",
                value: (
                  <span className="flex items-center gap-2">
                    <OrgAvatar name={organization.name} size="sm" />
                    {organization.name}
                  </span>
                ),
              },
              { label: "Domain", value: claim.domain, mono: true },
              { label: "SSO connection", value: claim.connection },
              { label: "Requested by", value: claim.requestedBy },
              { label: "Members affected", value: claim.affected },
            ]}
          />
        </SectionCard>
        <SectionCard title="Verification">
          <DetailList
            labelWidth="w-28"
            items={[
              { label: "Method", value: "DNS TXT record" },
              { label: "Record", value: claim.record, mono: true },
              { label: "Value", value: claim.value, mono: true },
              { label: "Verified", value: claim.verified },
              { label: "Expires", value: claim.expires },
            ]}
          />
        </SectionCard>
      </div>
      <SectionCard title="Conflicts">
        <Checklist
          checks={[
            { state: "done", title: `No other organization claims ${claim.domain}` },
            {
              state: "done",
              title: "No subdomain conflicts",
              detail: subdomain
                ? `${claim.domain.split(".").slice(1).join(".")} is held by the same organization`
                : `contractors.${claim.domain} is claimed by the same organization`,
            },
          ]}
        />
      </SectionCard>
      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={() => setDialog(null)}
        icon={CheckCircleIcon}
        tone="accent"
        destructive={false}
        title={`Approve ${claim.domain} for ${organization.name}?`}
        description={`${claim.affected} start signing in through ${claim.connection.split(" · ")[0]}.`}
        confirmLabel="Approve claim"
        onConfirm={() =>
          feedback.done("Claim approved", `${claim.domain} now routes to ${organization.name}.`)
        }
      />
      <ConfirmDialog
        open={dialog === "reject" || dialog === "withdraw"}
        onOpenChange={() => setDialog(null)}
        icon={GlobeIcon}
        title={
          dialog === "withdraw"
            ? `Withdraw approval for ${claim.domain}?`
            : `Reject ${organization.name}’s claim?`
        }
        description={`Emails at ${claim.domain} stop going to ${organization.name}’s SSO. The organization keeps its verified domain and can ask again.`}
        confirmLabel={dialog === "withdraw" ? "Withdraw approval" : "Reject claim"}
        onConfirm={feedback.notConnected}
      />
    </InstancePage>
  );
}
