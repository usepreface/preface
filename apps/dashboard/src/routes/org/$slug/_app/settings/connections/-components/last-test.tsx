import { Button } from "@usepreface/ui/components/button";
import { ArrowRightIcon } from "@usepreface/ui/icons";

import { DetailList } from "#/components/data-display/detail-list";
import { StatusBadge } from "#/components/data-display/status-badge";
import { SectionCard } from "#/components/shell/section-card";
import { connectionDetails, type SsoConnection } from "#/lib/placeholder";

export function LastTest({
  connection,
  onOpen,
}: {
  connection: SsoConnection;
  onOpen: () => void;
}) {
  const { lastTest } = connectionDetails.oidc;
  if (connection.status === "draft") {
    return (
      <SectionCard title="Last test">
        <p className="text-13 text-fg-secondary">
          Not tested yet. Save the settings, then run a test sign-in.
        </p>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Last test">
      <StatusBadge status={{ label: "Passed", tone: "success", dot: true }} />
      <DetailList
        labelWidth="w-24"
        items={[
          { label: "When", value: lastTest.when },
          { label: "By", value: lastTest.by },
          { label: "Signed in as", value: lastTest.account },
        ]}
      />
      <Button variant="ghost" size="sm" className="self-start" onClick={onOpen}>
        View details
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    </SectionCard>
  );
}
