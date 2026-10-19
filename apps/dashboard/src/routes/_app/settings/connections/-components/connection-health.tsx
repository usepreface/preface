import type { IdentityConnectionId } from "@usepreface/protocol";
import { Button } from "@usepreface/ui/components/button";

import { ApiClient } from "#/atoms/client";
import { QueryKeys } from "#/atoms/query-keys";
import { QueryState } from "#/components/api/query-state";
import { Notice } from "#/components/feedback/notice";
import { toQuery } from "#/hooks/query";
import { formatDate } from "#/lib/dates";
import { requestFields } from "#/lib/request-fields";
const useHealth = toQuery((connectionId: IdentityConnectionId) =>
  ApiClient.query(
    "connectionOperations",
    "health",
    requestFields({
      params: { connectionId },
      reactivityKeys: [QueryKeys.authority, QueryKeys.organization],
    }),
  ),
);
export function ConnectionHealth({ connectionId }: { connectionId: IdentityConnectionId }) {
  const query = useHealth(connectionId);
  return (
    <QueryState query={query}>
      <Notice
        title={
          query.data?.approved
            ? "Approved for organization sign-in"
            : "Not approved in login policy"
        }
      >
        Verified-domain proof: {query.data?.domainProofAvailable ? "available" : "not configured"}
      </Notice>
      {query.data?.certificates.map((certificate, index) => (
        <p key={`${certificate.role}:${index}`} className="text-sm text-fg-secondary">
          {certificate.role.toUpperCase()} certificate: {certificate.status.replaceAll("_", " ")} ·
          Expires {formatDate(certificate.expiresAt)}
        </p>
      ))}
      <Button variant="outline" onClick={query.refetch}>
        Refresh health
      </Button>
    </QueryState>
  );
}
