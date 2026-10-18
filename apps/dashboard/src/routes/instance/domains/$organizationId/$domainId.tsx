import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Schema } from "effect";

import { OrganizationId, OrganizationDomainId } from "@usepreface/protocol";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { operatorDomainAtom } from "#/atoms/organizations";
import { QueryState } from "#/components/api/query-state";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import { PageTitle } from "#/components/shell/page";
import {
  useOrganizationDomainsApprove,
  useOrganizationDomainsWithdrawApproval,
} from "#/hooks/identity";
import { toQuery } from "#/hooks/query";
import { formatDate } from "#/lib/dates";

import { InstancePage } from "../../-components/instance-page";

export const Route = createFileRoute("/instance/domains/$organizationId/$domainId")({
  component: DomainReview,
});
const useDomain = toQuery(operatorDomainAtom);
function DomainReview() {
  const raw = Route.useParams();
  const params = Schema.decodeUnknownSync(
    Schema.Struct({ organizationId: OrganizationId, domainId: OrganizationDomainId }),
  )(raw);
  const query = useDomain(params.organizationId, params.domainId);
  const approve = useOrganizationDomainsApprove();
  const revoke = useOrganizationDomainsWithdrawApproval();
  const [action, setAction] = useState<"approve" | "revoke">();
  return (
    <InstancePage crumbs={[{ label: "Domain review" }]}>
      <PageTitle
        title={query.data?.domain ?? "Review domain"}
        description={`Organization ${params.organizationId}`}
      />
      <Notice>
        Confirm domain ownership independently before approval. This grants email-domain authority
        to the exact organization claim, without granting membership.
      </Notice>
      <QueryState query={query}>
        <p className="text-sm text-fg-secondary">
          Method: {query.data?.verificationMethod ?? "Unverified"} · Valid until{" "}
          {formatDate(query.data?.verifiedUntil)} ·{" "}
          {query.data?.revokedAt ? "Revoked" : "Current claim"}
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setAction("approve")}>Approve exact claim</Button>
          <Button variant="outline" onClick={() => setAction("revoke")}>
            Withdraw manual approval
          </Button>
        </div>
      </QueryState>
      <ConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open) setAction(undefined);
        }}
        pending={approve.pending || revoke.pending}
        icon={TrashIcon}
        title={action === "approve" ? "Approve this domain claim?" : "Withdraw approval?"}
        description={query.data?.domain}
        confirmText={query.data?.domain}
        confirmLabel="Confirm decision"
        onConfirm={async () => {
          if (!query.data) return;
          const input = { params, payload: { expectedRevision: query.data.revision } };
          const response =
            action === "approve" ? await approve.run(input) : await revoke.run(input);
          if (response) setAction(undefined);
        }}
      />
    </InstancePage>
  );
}
