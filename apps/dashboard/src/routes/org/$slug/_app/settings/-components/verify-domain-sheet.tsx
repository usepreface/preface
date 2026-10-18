import { Button } from "@usepreface/ui/components/button";
import { Label } from "@usepreface/ui/components/label";
import { Select, SelectTrigger, SelectValue } from "@usepreface/ui/components/select";
import { ClockIcon, GlobeIcon, RefreshIcon } from "@usepreface/ui/icons";

import { CopyField } from "#/components/data-display/copy-field";
import { IconTile } from "#/components/data-display/icon-tile";
import { FormSheet } from "#/components/feedback/form-dialog";
import { Notice } from "#/components/feedback/notice";
import { feedback } from "#/lib/feedback";
import { domainChallenge } from "#/lib/placeholder";

/** The DNS record that proves ownership of a pending domain, and its last check. */
export function VerifyDomainSheet({
  domain,
  open,
  onOpenChange,
}: {
  domain: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const challenge = {
    ...domainChallenge,
    name: domainChallenge.name.replace(domainChallenge.domain, domain),
  };
  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      media={<IconTile icon={GlobeIcon} />}
      title={`Verify ${domain}`}
      description="Pending · started Oct 18 by Aisha Khan"
      footer={
        <>
          <Button variant="ghost" onClick={() => feedback.done(`${domain} removed`)}>
            Remove domain
          </Button>
          <Button
            onClick={() => feedback.done("Checking DNS", "We’ll update the status in a moment.")}
          >
            <RefreshIcon data-icon="inline-start" />
            Check verification
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-secondary">
        Add this TXT record at your DNS provider, then check verification. Changes can take up to 48
        hours to appear.
      </p>
      {(
        [
          ["Type", challenge.type],
          ["Name", challenge.name],
          ["Value", challenge.value],
        ] as const
      ).map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span className="text-13 font-medium text-foreground">{label}</span>
          <CopyField value={value} label={`Record ${label.toLowerCase()}`} />
        </div>
      ))}
      <Notice tone="warning" icon={ClockIcon} title="Record not found yet">
        {challenge.lastCheck}
      </Notice>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="domain-connection">Link to SSO connection</Label>
        <Select disabled>
          <SelectTrigger id="domain-connection" className="w-full">
            <SelectValue placeholder="Available after verification" />
          </SelectTrigger>
        </Select>
        <p className="text-caption text-fg-tertiary">
          Then emails at {domain} go to that connection once an instance owner approves.
        </p>
      </div>
    </FormSheet>
  );
}
