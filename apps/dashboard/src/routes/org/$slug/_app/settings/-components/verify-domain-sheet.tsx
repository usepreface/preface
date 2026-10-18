import { useState } from "react";

import type { PublicOrganizationDomain, DomainChallenge } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import { CopyField } from "#/components/data-display/copy-field";
import { FormSheet } from "#/components/feedback/form-dialog";
import { Notice } from "#/components/feedback/notice";
import { useOrganizationDomainsRequest, useOrganizationDomainsVerify } from "#/hooks/identity";
import { useOrganization } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";
import { feedback } from "#/lib/feedback";

export function VerifyDomainSheet({
  domain,
  onClose,
}: {
  domain: typeof PublicOrganizationDomain.Type;
  onClose: () => void;
}) {
  const { organization } = useOrganization();
  const request = useOrganizationDomainsRequest();
  const verify = useOrganizationDomainsVerify();
  const [challenge, setChallenge] = useState<typeof DomainChallenge.Type>();
  const params = { organizationId: organization.id, domainId: domain.id };
  return (
    <FormSheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Verify ${domain.domain}`}
      description="Publish the exact TXT record, then confirm after DNS propagation."
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {challenge ? (
        <>
          <Notice>Challenge expires {formatDate(challenge.expiresAt)}.</Notice>
          <p className="text-sm font-medium">TXT record name</p>
          <CopyField value={challenge.recordName} label="TXT record name" />
          <p className="text-sm font-medium">TXT record value</p>
          <CopyField value={challenge.recordValue} label="TXT record value" />
          <Button
            disabled={verify.pending}
            onClick={async () => {
              if (
                await verify.run({
                  params,
                  payload: { expectedRevision: challenge.domain.revision },
                })
              ) {
                feedback.done("Domain verified");
                onClose();
              }
            }}
          >
            Check DNS and verify
          </Button>
          <Button
            variant="outline"
            disabled={request.pending}
            onClick={async () => {
              const response = await request.run({
                params,
                payload: { expectedRevision: challenge.domain.revision },
              });
              if (response) setChallenge(response.value);
            }}
          >
            Replace challenge
          </Button>
        </>
      ) : (
        <Button
          disabled={request.pending}
          onClick={async () => {
            const response = await request.run({
              params,
              payload: { expectedRevision: domain.revision },
            });
            if (response) setChallenge(response.value);
          }}
        >
          Generate DNS challenge
        </Button>
      )}
    </FormSheet>
  );
}
