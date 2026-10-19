import { useState } from "react";

import { DateTime } from "effect";

import type { IdentityConnectionId, OrganizationDomainId } from "@usepreface/protocol";
import type {
  PublicOrganizationIdentityConnection,
  PublicOrganizationDomain,
} from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";

import { ApiClient } from "#/atoms/client";
import { QueryKeys } from "#/atoms/query-keys";
import { QueryState } from "#/components/api/query-state";
import { PageSection } from "#/components/shell/page";
import { useOrganizationDomainsBind } from "#/hooks/identity";
import { useDomains } from "#/hooks/organizations";
import { toQuery } from "#/hooks/query";
import { requestFields } from "#/lib/request-fields";

const useBinding = toQuery((connectionId: IdentityConnectionId) =>
  ApiClient.query(
    "organizationDomains",
    "connectionDomains",
    requestFields({
      params: { connectionId },
      reactivityKeys: [QueryKeys.authority, QueryKeys.organization],
    }),
  ),
);
export function ConnectionDomains({
  connection,
}: {
  connection: typeof PublicOrganizationIdentityConnection.Type;
}) {
  const binding = useBinding(connection.id);
  const domains = useDomains();
  return (
    <PageSection
      title="Trusted email domains"
      description="Only verified claims explicitly bound here can supply domain-based mailbox proof. Domains do not grant membership."
    >
      <QueryState query={binding}>
        <QueryState query={domains}>
          {binding.data && domains.data ? (
            <DomainSelection
              key={connection.revision}
              connection={connection}
              selected={binding.data.domains.map((domain) => domain.id)}
              domains={domains.data.domains}
            />
          ) : null}
        </QueryState>
      </QueryState>
    </PageSection>
  );
}
function DomainSelection({
  connection,
  selected,
  domains,
}: {
  connection: typeof PublicOrganizationIdentityConnection.Type;
  selected: readonly OrganizationDomainId[];
  domains: readonly (typeof PublicOrganizationDomain.Type)[];
}) {
  const [chosen, setChosen] = useState(selected);
  const bind = useOrganizationDomainsBind();
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      {domains
        .filter(
          (domain) =>
            chosen.includes(domain.id) ||
            (!domain.revokedAt &&
              domain.verifiedUntil !== null &&
              DateTime.toEpochMillis(domain.verifiedUntil) > Date.now()),
        )
        .map((domain) => (
          <label key={domain.id} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={chosen.includes(domain.id)}
              onChange={(event) =>
                setChosen((previous) =>
                  event.target.checked
                    ? [...previous, domain.id]
                    : previous.filter((id) => id !== domain.id),
                )
              }
            />
            {domain.domain}
          </label>
        ))}
      {domains.length === 0 ? (
        <p className="text-sm text-fg-secondary">Add and verify an organization domain first.</p>
      ) : null}
      <Button
        disabled={bind.pending || connection.status !== "active"}
        onClick={() =>
          void bind.run({
            params: { connectionId: connection.id },
            payload: { expectedRevision: connection.revision, domainIds: chosen },
          })
        }
      >
        Save trusted domains
      </Button>
    </div>
  );
}
