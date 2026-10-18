import { Link } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";

import { QueryState } from "#/components/api/query-state";
import { Notice } from "#/components/feedback/notice";
import { PageSection } from "#/components/shell/page";
import { useOrganization, useReadiness } from "#/hooks/organizations";

export function SsoReadiness() {
  const { organization } = useOrganization();
  const readiness = useReadiness(organization.id);
  return (
    <PageSection
      className="rounded-xl border bg-surface-1 p-5"
      title="SSO readiness"
      actions={
        <Button type="button" variant="outline" onClick={readiness.refetch}>
          Check readiness
        </Button>
      }
    >
      <QueryState query={readiness}>
        <Notice
          tone={readiness.data?.ready ? "success" : "info"}
          title={readiness.data?.ready ? "Ready to require SSO" : "Prepare SSO before enabling it"}
        >
          {readiness.data?.blockers.map((blocker) => (
            <p key={blocker}>{blocker.replaceAll("_", " ").toLowerCase()}</p>
          ))}
        </Notice>
        <p className="text-sm text-fg-secondary">
          {readiness.data?.owners.filter((owner) => owner.ssoLinked).length ?? 0} owners have SSO
          linked; {readiness.data?.owners.filter((owner) => owner.recoveryPrepared).length ?? 0}{" "}
          have recovery prepared.
        </p>
        <Link to="/account/security">Link or confirm your provider account</Link>
      </QueryState>
    </PageSection>
  );
}
